本项目是知识图谱平台
后端(django - dvadmin框架)根目录: @KGManagement/backend
前端(vue) 根目录:@KGManagement/web
前端(react) 根目录: @KGManagement/web-react

目前情况:
1.项目主前端是vue, 里面有完整的框架, 如鉴权等
2.项目业务逻辑目前是 react版本, 在目录 @KGManagement/web-react 里面有完整的业务逻辑和 mock数据
3.vue版本的前端路由 包含 后端动态控制 + 前端静态控制 @KGManagement/web/src/utils/menu.ts


需求: 将react版本转为vue版本
1.将vue版本的业务根页面 '/home' 的内容清空 @KGManagement/web/src/views/system/home/index.vue
2.react 转为 vue 的根页面放在 @KGManagement/web/src/views/system/home/index.vue
3.注意路由