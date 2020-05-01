/**
 * conditionOperat 可以对一系列复杂的条件进行逻辑运算，条件可以是基本类型的数据，也可以是个函数，甚至可以是个异步条件，即 Promise；或者是个条件集，条件集也可以再嵌套条件集；可以指定条件之间的逻辑关系，如：与、或、非；
 *
 * - 主页：<https://github.com/GuoBinyong/condition-operat>
 *
 * **如果您在使用的过程中遇到了问题，或者有好的建议和想法，您都可以通过以下方式联系我，期待与您的交流：**
 * - 给该仓库提交 issues
 * - 给我 Pull requests
 * - 邮箱：<guobinyong@qq.com>
 * - QQ：guobinyong@qq.com
 * - 微信：keyanzhe
 */








/**
 * 判断目标是否是对象类型
 * @param target : any   目标对象
 *
 * 仅通过 target instanceof Object 判断是不行的，因为 对于 Object.create(null) 创建的对象 通过 ` Object.create(null) instanceof Object ` 来判断 返回的是 false
 * 即：通过 Object.create(null) 创建的对象是不被 instanceof  认为是继续于 Object 的
 *
 * typeof null 也返回 "object"
 */
function isObject(target:any):boolean {
  // return target instanceof Object || typeof target === "object"
  var tarType = typeof target;
  return  target && (tarType === "object" || tarType === "function");
}






/**
 * 非运算表达式
 */
interface NotExpression {
  /**
   * 对原来的值取反
   */
  not?:boolean;
}


/**
 * NotExpression 的类型守卫
 */
function isNotExpression(expr:any): expr is NotExpression {
  return isObject(expr)
}


/**
 * 映射条件类型
 * 表示 在 条件映射对象 ConditionMap 中，条件表达式对应的 key
 */
type MapCondition = string | number | (String & NotExpression) | (Number & NotExpression) | symbol

/**
 * MapCondition 的类型守卫
 */
function isMapCondition(cond:any):  cond is  MapCondition {
  let condType = typeof cond;
  return condType === "string" || condType === "number" || condType === "symbol" || cond instanceof String || cond instanceof Number
}


/**
 * ConditionMap 的 属性类型
 */
type  ConditionMapKey = string | number

/**
 * 条件映射对象的类型
 * 映射条件 可通过 该类型的对象来查找其对应的条件；
 *
 * 接口的索引签名类型不能用联合类型
 */
/*interface ConditionMap<ThisValue, Args>  {
  [prop : string | number | symbol]: CondExpression<ThisValue, Args>;
}*/
type ConditionMap<ThisValue, Args> = {
  [prop in ConditionMapKey ]: CondExpression<ThisValue, Args>;
} & ThisType<ThisValue>;


/**
 * ConditionMap 的类型守卫
 */
function isConditionMap<ThisValue,Args>(condMap:any): condMap is ConditionMap<ThisValue,Args> {
  return isObject(condMap)
}






/**
 * 对象条件类型
 * 表示那些除  函数条件 FunCondition 、异步条件 PromCondition 外 的 对象；当这些对象被作为 条件 时，会将其valueOf()方法返回的值转换成 布尔值，然后作 布尔条件 来用
 */
interface ObjCondition extends NotExpression{}

/**
 * ObjCondition 的类型守卫
 */
function isObjCondition(cond:any): cond is ObjCondition {
  return cond && cond instanceof Object && !(isConditionSet(cond) || isFunCondition(cond) || isPromCondition(cond))
}




/**
 * 布尔条件
 * 代表那些可直接被当作布尔值来计算的 真假 和 假值；
 */
type BoolCondition = boolean | undefined | null | Boolean | ObjCondition



/**
 * BoolCondition 的类型守卫
 */
function isBoolCondition(cond:any): cond is BoolCondition {
  return typeof cond === "boolean" || cond == undefined || cond instanceof Boolean || isObjCondition(cond)
}


/**
 * PromCondition 类型的条件返回的结果的类型
 */
type PromConditionResult<ThisValue,Args> =  BoolCondition | FunCondition<ThisValue,Args> | MapCondition | ConditionSet<ThisValue,Args>

/**
 * 异步条件
 * 根据决议的值反复地进行条件运算，直到计算到得到 布尔结果 为止；
 */
// interface PromCondition<ThisValue,Args> extends Promise<PromConditionResult<ThisValue,Args>>,NotExpression {}
type PromCondition<ThisValue,Args> = Promise<PromConditionResult<ThisValue,Args>> & NotExpression



/**
 * PromCondition 的类型守卫
 */
function isPromCondition<ThisValue,Args>(cond:any): cond is PromCondition<ThisValue,Args> {
  return cond instanceof Promise
}



/**
 * 函数条件
 * 带有逻辑的函数，会对其返回值反复地进行条件运算，直到计算到得到 布尔结果 为止；
 */
interface FunCondition<ThisValue,Args> extends NotExpression {
  (this:ThisValue,...args:Args extends any[] ? Args : []):CondExpression<ThisValue,Args>;
}



/**
 * FunCondition 的类型守卫
 */
function isFunCondition<ThisValue,Args>(cond:any): cond is FunCondition<ThisValue,Args> {
  return typeof cond === "function"
}




/**
 * 条件的类型
 * 条件是用来表达 真 或 假 的基本运算单元；
 */
type Condition<ThisValue,Args> = BoolCondition | FunCondition<ThisValue,Args> | PromCondition<ThisValue,Args> | MapCondition

/**
 * Condition 的类型守卫
 */
function isCondition<ThisValue,Args>(cond:any): cond is Condition<ThisValue,Args> {
  return isFunCondition<ThisValue,Args>(cond) || isPromCondition<ThisValue,Args>(cond) || isMapCondition(cond) || isBoolCondition(cond)
}



/**
 * 关系类型
 */
type Relationship = "and" | "or"


/**
 * 条件集
 * 条件集 ConditionSet 是用来表达 多个条件表达式 相与 或者 相或 关系的一种表达式；它包含多个条件表达式，并携带有关系信息（与、或）；
 */
interface ConditionSet<ThisValue,Args>  extends Array<CondExpression<ThisValue,Args>>,NotExpression {
  /**
   * 各个条件表达式之间的关系；
   * 默认值："and"
   */
  rel?:Relationship;
}


/**
 * ConditionSet 的类型守卫
 */
function isConditionSet<ThisValue,Args>(expr:any): expr is ConditionSet<ThisValue,Args> {
  return Array.isArray(expr)
}




/**
 * 条件表达式
 * 条件集 ConditionSet 和 条件 Condition 统称为 条件表达式
 */
type CondExpression<ThisValue,Args> = ConditionSet<ThisValue,Args> | Condition<ThisValue,Args>


/**
 * CondExpression 的类型守卫
 */
function isCondExpression<ThisValue,Args>(expr:any): expr is CondExpression<ThisValue,Args> {
  return isConditionSet<ThisValue,Args>(expr) || isCondition<ThisValue,Args>(expr)
}









/**
 * 非值的类型
 */
type NotValue = NotExpression["not"]

/**
 * 非值的序列
 */
type NotSequence = NotValue[]


/**
 * 对 target 做一系列连续的 非操作，
 * @param target : any    操作的目标，如果 target 有 valueOf() 方法，会将 valueOf() 方法返回的值作为布尔值来对象，否则，会直接将 target 作为布尔值来对待
 * @param notSequ : NotSequence    指示非操作序列的数组
 * @return boolean     非操作后的结果
 */
function notOperat(target:any,notSequ:NotSequence):boolean {
  return notSequ.reduce(function (res,not) {
    return not && not.valueOf() ? !res : res;
  },Boolean(target && target.valueOf ? target.valueOf() : target) ) as boolean
}


/**
 * flatCondition 将表达式扁平化处理之后的结果类型
 */
type FlatResult<ThisValue,Args> = {
  expr:Exclude<CondExpression<ThisValue,Args>, MapCondition | FunCondition<ThisValue,Args>>,
  notSequ:NotSequence
};


/**
 * 递归条件
 * 表示 需要通过 运算才能得到真正的条件，并且运算后得到的条件 可能还是个 与原来相同类型的 条件
 *
 * 注意：
 * - 因为 异步条件 PromCondition 通过运算后返回的不会再是异步条件，所以 异步条件 PromCondition 不是递归条件；
 * - 但是 异步条件 PromCondition 通过运算后返回的条件 可能会是一个再次返回 异步条件的 条件；比如：异步条件 反应一个 函数条件，而该函数条件返回的又是一个异步条件；
 */
type RecursiveCondition<ThisValue,Args> = MapCondition | FunCondition<ThisValue,Args>


/**
 * 扁平化 递归条件 RecursiveCondition
 * @param operatOptions : OperatOptions   运算选项类型
 *
 * 函数条件 FunCondition 可能还会返回 函数条件 FunCondition，返回的 函数条件 FunCondition 可能还会返回 函数条件 FunCondition，可以无休止地这样延续下去；映射条件 MapCondition 也是；像这样的条件称为 递归条件
 * 本方法的作用就是对递归条件进行运算，直到返回的不是递归条件为止
 */
function flatCondition<ThisValue,Args>(operatOptions:OperatOptions<ThisValue,Args>): FlatResult<ThisValue,Args> {

  let {expr,"this":thisValue,args,notSequ,...otherProp} = operatOptions;
  let condMap = otherProp as ConditionMap<ThisValue,Args>

  if (!notSequ){
    notSequ = isNotExpression(expr) ? [expr.not] : [];
  }

  if (isMapCondition(expr)){
    var mapKey = (isObject(expr) ? expr.valueOf() : expr) as ConditionMapKey
    var nextExpr = condMap[mapKey]
  }else if (isFunCondition(expr)){
    // @ts-ignore
    nextExpr = expr.apply(thisValue,args)
  }else {
    return {
      expr:expr,
      notSequ:notSequ
    };
  }


  let nextOperOpts = {...operatOptions,expr:nextExpr,notSequ:undefined};

  var exprOpts = flatCondition(nextOperOpts);
  exprOpts.notSequ = notSequ.concat(exprOpts.notSequ)

  return exprOpts;
}










/**
 * 条件选项类型
 */
interface ExpressionOptions<ThisValue,Args> {
  expr?:CondExpression<ThisValue,Args>,   //条件表达式
  this?:ThisValue,    //设置条件表达式中 函数条件 的 this 的值

  /**
   * 设置条件表达式中 函数条件 的 参数序列；即该参数是个数组，里面包含传递给 条件函数 的参数
   *
   * 注意：
   * thisValue 和 args 会被应用到所有的 函数条件，包括那些 运算过程 中产生的函数条件，比如：函数条件返回的函数条件、异步条件决议时传递出的 函数条件
   */
  args?:Args,

  /**
   * 是否要对表达式进行全量运算，默认是短路计算；全量计算会对条件集中的每个条件进行计算；
   *
   * # 全景运算
   * 会对表达式中的所有条件依次且完全地进行运算
   *
   * # 短路运算
   * 在对条件表达式进行运算的过程中，如果运算中途已经能够确认最终的运算结果，则便会停止对剩余表达式的计算，并返回计算结果；
   *
   * ## 简单优先
   * 为了提高运算效率，除了加入了短路运算的特性外，还加入了简单优先的计算原则，即：对于同一层级表达式，会按照下面的顺序优先计算：
   * 1. BoolCondition | RecursiveCondition: 布尔条件 BoolCondition 和 扁平化后 布尔条件 BoolCondition 的 递归条件 RecursiveCondition；
   * 2. ConditionSet : 条件集；
   * 3. PromCondition : 异步条件；
   */
  full?:boolean,

  /*
  非值的序列
  如果存在该属性值，则忽略 expr 属性的 表达式的 not 属性
  */
 notSequ?:NotSequence
}

/**
 * ExpressionOptions 的类型守卫
 */
function isExpressionOptions<ThisValue,Args>(opts:any): opts is ExpressionOptions<ThisValue,Args> {
  return opts && (opts.expr || opts.this || opts.args || opts.full || opts.notSequ)
}









/**
 * 条件运算的选项的类型
 */
type OperatOptions<ThisValue,Args> = ExpressionOptions<ThisValue,Args> & ConditionMap<ThisValue, Args>

/**
 * OperatOptions 的类型守卫
 */
function isOperatOptions<ThisValue,Args>(opts:any): opts is OperatOptions<ThisValue,Args> {
  return isConditionMap<ThisValue,Args>(opts) || isExpressionOptions<ThisValue,Args>(opts)
}







/**
 * 运算结果的类型
 */
type OperatedResult = boolean | Promise<boolean>


/**
 * conditionOperat 接口
 */
export interface conditionOperat {
  create<ThisValue,Args>(...operatOptions:OperatOptions<ThisValue,Args>[]): (...operatOptions:OperatOptions<ThisValue,Args>[])=>OperatedResult;
  create<ThisValue,Args>(condExpress:CondExpression<ThisValue,Args>,...operatOptions:OperatOptions<ThisValue,Args>[]): (...operatOptions:OperatOptions<ThisValue,Args>[])=>OperatedResult;
}





/**
 * 条件运算
 * 对一系列条件进行逻辑运算；
 *
 * @returns OperatedResult   返回 OperatedResult 类型的结果，即 布尔类型 或者 返回布尔类型的 Promise 类型 的值；
 * 只有依靠 异步条件 才能决定最后的运算结果时，conditionOperat 才会返回 Promise 类型的 异步运算结果
 */


 /**
  * 接口1
  * conditionOperat<ThisValue,Args>(...operatOptions:OperatOptions<ThisValue,Args>[]):OperatedResult
  * @param operatOptions : OperatOptions  conditionOperat 接收一系列关于条件的选项对象
  *
  */
export function conditionOperat<ThisValue,Args>(...operatOptions:OperatOptions<ThisValue,Args>[]):OperatedResult;

/**
 * 接口2
 * @param condExpress : CondExpression   条件表达式
 * @param operatOptions : OperatOptions   一系列关于条件的选项对象
 *
 */
export function conditionOperat<ThisValue,Args>(condExpress:CondExpression<ThisValue,Args>,...operatOptions:OperatOptions<ThisValue,Args>[]):OperatedResult;
export function conditionOperat<ThisValue,Args>(exprOrOptions:CondExpression<ThisValue,Args>|OperatOptions<ThisValue,Args>,...operatOptions:OperatOptions<ThisValue,Args>[]):OperatedResult {

  let finalOperOpts = Object.assign({},exprOrOptions,...operatOptions);

  /*
  在以下任一情况下，都需要将 exprOrOptions 作为 表达式来用
  - finalOperOpts 中没有表达式 expr 属性；
  - exprOrOptions 不是 OperatOptions 类型；
  */
  if (!( "expr" in finalOperOpts && isOperatOptions(exprOrOptions))){
    finalOperOpts.expr = exprOrOptions;
  }

  if (finalOperOpts.full){
    return conditionOperatForFull(finalOperOpts);
  }

  return conditionOperatForFast(finalOperOpts);
}


 /**
  * 以短路的方式进行条件运算
  * conditionOperatForFast<ThisValue,Args>(operatOptions:OperatOptions<ThisValue,Args>):OperatedResult
  * @param operatOptions : OperatOptions  关于条件的选项对象
  *
  * @returns OperatedResult   返回 OperatedResult 类型的结果，即 布尔类型 或者 返回布尔类型的 Promise 类型 的值；
  * 只有依靠 异步条件 才能决定最后的运算结果时，conditionOperat 才会返回 Promise 类型的 异步运算结果
  */
function conditionOperatForFast<ThisValue,Args>(operatOptions:OperatOptions<ThisValue,Args>):OperatedResult {

  let finalOperOpts = {...operatOptions};

  let {"this":thisValue,args,...condMap} = finalOperOpts;

  let {expr:condExpress,notSequ} = flatCondition(finalOperOpts);

  if (isPromCondition<ThisValue,Args>(condExpress)){
    return condExpress.then(function(expr){
      finalOperOpts.expr = expr;
      finalOperOpts.notSequ = notSequ;
      return conditionOperatForFast(finalOperOpts);
    },function(reason){
      return notOperat(false,notSequ);
    });
  } else if (isConditionSet(condExpress)){
    var condSet:ConditionSet<ThisValue,Args> = condExpress as ConditionSet<ThisValue,Args>
  } else {
    return notOperat(condExpress,notSequ);
  }




  let notOper = function(b:any){
    return notOperat(b,notSequ)
  };

  let proCondArr:PromCondition<ThisValue,Args>[] = []
  let condSetArr:ConditionSet<ThisValue,Args> = []

  if (condSet.rel === "or"){

    //先计算 不是 数组 和 不是 Promise 的 条件进行计算
    let orRes = condSet.some(function (condExp) {

      let operOpts = {...finalOperOpts,expr:condExp,notSequ:undefined};

      let {expr:finalExpr,notSequ} = flatCondition(operOpts);

      if (isConditionSet(finalExpr)){
        condSetArr.push(finalExpr)
        return false
      }else if (isPromCondition<ThisValue,Args>(finalExpr)) {
        proCondArr.push(finalExpr)
        return false
      }else {
        return notOperat(finalExpr,notSequ);
      }


    });

    if (orRes){
      return notOper(true)
    }

  //  专门 计算 数组条件的 运算结果
  if (condSetArr.length > 0){
    let condSetArrRes = condSetArr.some(function (condSet) {
      let operOpts = {...finalOperOpts,expr:condSet,notSequ:undefined};
      let cond = conditionOperatForFast(operOpts);

      //先跳过 Promise 类型
      if (isPromCondition(cond)){
        proCondArr.push(cond)
        return false
      }

      return cond;
    });
    if (condSetArrRes) {
      return notOper(true)
    }
  }

    //  专门 计算 Promise 条件的 运算结果
  if (proCondArr.length > 0){
    return  Promise.allSettled(proCondArr).then(function (proCondArrResArr) {
      let proCondResArr:ConditionSet<ThisValue,Args> =  proCondArrResArr.map(function (proRes) {
        return proRes.status === "fulfilled" ? proRes.value : false
      });

      proCondResArr.rel = condSet.rel;
      let operOpts = {...finalOperOpts,expr:proCondResArr,notSequ};
      return conditionOperatForFast(operOpts);
    });

  }

  return notOper(orRes) ;




  }else {



    //先计算 不是 数组 和 不是 Promise 的 条件进行计算
    let andRes = condSet.every(function (condExp) {

      let operOpts = {...finalOperOpts,expr:condExp,notSequ:undefined};

      let {expr:finalExpr,notSequ} = flatCondition(operOpts);


      if (isConditionSet(finalExpr)){
        condSetArr.push(finalExpr)
        return true
      }else if(isPromCondition<ThisValue,Args>(finalExpr)){
        proCondArr.push(finalExpr)
        return true
      }else {
        return notOperat(finalExpr,notSequ);
      }

    });

    if (!andRes){
      return notOper(false)
    }

    //  专门 计算 数组条件的 运算结果
    if (condSetArr.length > 0){
      let condSetArrRes = condSetArr.every(function (condSet) {
        let operOpts = {...finalOperOpts,expr:condSet,notSequ:undefined};
        let cond = conditionOperatForFast(operOpts);


        //先跳过 Promise 类型
        if (isPromCondition(cond)){
          proCondArr.push(cond)
          return true
        }

        return cond
      });
      if (!condSetArrRes) {
        return notOper(false)
      }
    }

    //  专门 计算 Promise 条件的 运算结果
    if (proCondArr.length > 0){
      return  Promise.allSettled(proCondArr).then(function (proCondArrResArr) {
        let proCondResArr:ConditionSet<ThisValue,Args> =  proCondArrResArr.map(function (proRes) {
          return proRes.status === "fulfilled" ? proRes.value : false
        });

        proCondResArr.rel = condSet.rel;

        let operOpts = {...finalOperOpts,expr:proCondResArr,notSequ};
        return conditionOperatForFast(operOpts);
      });

    }

    return notOper(andRes);



  }




}





 /**
  * 以全量的方式进行条件运算
  * conditionOperatForFull<ThisValue,Args>(operatOptions:OperatOptions<ThisValue,Args>):OperatedResult
  * @param operatOptions : OperatOptions  关于条件的选项对象
  *
  * @returns OperatedResult   返回 OperatedResult 类型的结果，即 布尔类型 或者 返回布尔类型的 Promise 类型 的值；
  * 只有依靠 异步条件 才能决定最后的运算结果时，conditionOperat 才会返回 Promise 类型的 异步运算结果
  */
function conditionOperatForFull<ThisValue,Args>(operatOptions:OperatOptions<ThisValue,Args>):OperatedResult {

  let finalOperOpts = {...operatOptions};

  let {"this":thisValue,args,...condMap} = finalOperOpts;

  let {expr:condExpress,notSequ} = flatCondition(finalOperOpts);


  if (isPromCondition<ThisValue,Args>(condExpress)){
    return condExpress.then(function(expr){
      finalOperOpts.expr = expr;
      finalOperOpts.notSequ = notSequ;
      return conditionOperatForFull(finalOperOpts);
    },function(reason){
      return notOperat(false,notSequ);
    });
  } else if (isConditionSet(condExpress)){
    var condSet:ConditionSet<ThisValue,Args> = condExpress as ConditionSet<ThisValue,Args>
    var condSetRes = condSet.map(function (condExp) {
      let operOpts = {...finalOperOpts,expr:condExp,notSequ:undefined};
      return conditionOperatForFull(operOpts);
    });
  } else {
    return notOperat(condExpress,notSequ);
  }


  let notOper = function(b:any){
    return notOperat(b,notSequ)
  };

  let proCondArr:PromCondition<ThisValue,Args>[] = []

  if (condSet.rel === "or"){

    //通过 不是 Promise 的 结果来确定 condSet 的值
    let orRes = condSetRes.some(function (condExp) {

      if (condExp instanceof Promise){
        proCondArr.push(condExp)
        return false
      }

      return condExp;
    });

    if (orRes){
      return notOper(true)
    }

  //通过 Promise 的 结果来确定 condSet 的值
  if (proCondArr.length > 0){
    return  Promise.allSettled(proCondArr).then(function (proCondArrResArr) {
      let proCondResArr:ConditionSet<ThisValue,Args> =  proCondArrResArr.map(function (proRes) {
        return proRes.status === "fulfilled" ? proRes.value : false
      });

      proCondResArr.rel = condSet.rel;
      let operOpts = {...finalOperOpts,expr:proCondResArr,notSequ};
      return conditionOperatForFull(operOpts);
    });

  }

  return notOper(orRes) ;




  }else {



    //通过 不是 Promise 的 结果来确定 condSet 的值
    let andRes = condSetRes.every(function (condExp) {
      if (condExp instanceof Promise){
        proCondArr.push(condExp)
        return true
      }

      return condExp;
    });

    if (!andRes){
      return notOper(false)
    }

    //通过 Promise 的 结果来确定 condSet 的值
    if (proCondArr.length > 0){
      return  Promise.allSettled(proCondArr).then(function (proCondArrResArr) {
        let proCondResArr:ConditionSet<ThisValue,Args> =  proCondArrResArr.map(function (proRes) {
          return proRes.status === "fulfilled" ? proRes.value : false
        });

        proCondResArr.rel = condSet.rel;

        let operOpts = {...finalOperOpts,expr:proCondResArr,notSequ};
        return conditionOperatForFull(operOpts);
      });

    }

    return notOper(andRes);



  }




}












/**
 * 创建快捷运算函数
 * 快捷运算函数 是带有默认选项的条件运算函数；
 *
 * @returns  (...operatOptions:OperatOptions<ThisValue,Args>[])=>OperatedResult   返回一个将之前传入的选项作为默认选项，并可接收一系列条件的选项对象的 条件运算函数 conditionOperat(...operatOptions:OperatOptions<ThisValue,Args>[]):OperatedResult
 */

  /**
  * 接口1
  * create<ThisValue,Args>(...operatOptions:OperatOptions<ThisValue,Args>[]): (...operatOptions:OperatOptions<ThisValue,Args>[])=>OperatedResult
  * @param operatOptions : OperatOptions  conditionOperat 接收一系列关于条件的选项对象
  */
export function create<ThisValue,Args>(...operatOptions:OperatOptions<ThisValue,Args>[]): (...operatOptions:OperatOptions<ThisValue,Args>[])=>OperatedResult;

/**
 * 接口2
 * create<ThisValue,Args>(condExpress:CondExpression<ThisValue,Args>,...operatOptions:OperatOptions<ThisValue,Args>[]): (...operatOptions:OperatOptions<ThisValue,Args>[])=>OperatedResult
 * @param condExpress : CondExpression   条件表达式
 * @param operatOptions : OperatOptions   一系列关于条件的选项对象
 */
export function create<ThisValue,Args>(condExpress:CondExpression<ThisValue,Args>,...operatOptions:OperatOptions<ThisValue,Args>[]): (...operatOptions:OperatOptions<ThisValue,Args>[])=>OperatedResult;
export function create<ThisValue,Args>(exprOrOptions:CondExpression<ThisValue,Args>|OperatOptions<ThisValue,Args>,...operatOptions:OperatOptions<ThisValue,Args>[]){


  var finalOperOpts = Object.assign({},exprOrOptions,...operatOptions);

  if (!isOperatOptions(exprOrOptions)){
    finalOperOpts.expr = exprOrOptions;
  }

  function operatWith(...operOpts:OperatOptions<ThisValue,Args>[]):OperatedResult {
    return  conditionOperat(finalOperOpts,...operOpts);
  }

  return operatWith;
}


conditionOperat.create = create;


export default conditionOperat
