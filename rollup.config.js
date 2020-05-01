import "es-expand"
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';
import pkg from './package.json';


/**
 * 获取 package.json 中配置的 description、optionalDependencies、peerDependencies 中的所有依赖的名字列表
 * Get an array of dependent names in the configuration of description, optional Dependencies, peer Dependencies configured in package.json
 * @param {*} package  package.json 中的配置对象； Configuration objects in package.json
 * @returns Array<string>  返回包含 description、optionalDependencies、peerDependencies 中所有依赖名字的数组； Returns an array of all name-dependent names in the description, option, peer Dependencies
 */
function getDependencieNames(packageConf){
	return Object.keys(Object.assign({},packageConf.dependencies,packageConf.optionalDependencies,packageConf.peerDependencies))
}
  

/* 
注意：
- rollup 默认翻用的不是 node 的模块解析算法，所以，rollup 找不到由 npm 安装的依赖（模块），所以 由 npm 安装的依赖也不被被要想构建进最终的输出包中；这样也起到了排除 node_modules 中模块的效果；排除模块的功能 由 external 选项指定
- @rollup/plugin-node-resolve 插件可让 rollup 用 node 的模块解析算法来查找模块；
*/

export default [
	/* 
	浏览器友好的 UMD 构建
	特点：
	   - 将所有依赖都构建在了一起
	   - 可在不支持 js模块方案 的环境下运行，也可以作为 js模块 被导入
	*/
	{
		input: 'src/index.ts',
		output: {
			name: "cv",  //驼峰格式的 pkg.name
			file: pkg.browser,
			format: 'umd'
		},
		plugins: [
			resolve(), // 使用node解析算法查找模块
			commonjs(), // 将依赖的模块从 CommonJS 模块规范转换成 ES2015 模块规范
			typescript() // 将 TypeScript 转换为 JavaScript
		]
	},

	/* 
	模块友好的构建
	特点：
	   - 移除了 node_modules 中的所有依赖
	   - 仅支持以 js模块 的方式被导入
	*/
	{
		input: 'src/index.ts',
		external: getDependencieNames(pkg),  //移除 package.json 中所有的依赖包
		output: [
			{ file: pkg.main, format: 'cjs' }, // CommonJS (用于 Node)
			{ file: pkg.module, format: 'es' }  // ES module （用于打包工具（如：webpack等）
		],
		plugins: [
			typescript() // 将 TypeScript 转换为 JavaScript
		]
	}
];
