import fs from 'fs';

let c = fs.readFileSync('src/pages/SchemaDesign.tsx', 'utf8');

c = c.replace(/重名结构与冲突处理建议[\s\S]*?跳过导入<\/Button>\s*<\/div>\s*<\/div>\s*<\/div>/g, `重叠结构与冲突处理建议</h4>
                              <div className="flex items-center gap-3">
                                 <Badge variant="secondary" className="text-xs bg-white border border-slate-200">2 项需人工确认</Badge>
                                 <Badge variant="secondary" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">5 项安全合并</Badge>
                              </div>
                           </div>
                           <div className="divide-y text-sm">
                              {/* Conflict Row 1 */}
                              <div className="p-4 flex items-start gap-4 hover:bg-slate-50/50">
                                 <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                 <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-semibold">实体属性配置冲突：产品型号 (ProductModel)</span>
                                      <Badge variant="outline" className="text-[10px] text-red-600 border-red-200 bg-red-50">同名属性，约束与索引配置不同</Badge>
                                    </div>
                                    <div className="text-xs text-slate-600 bg-slate-100/50 p-3 rounded-md mb-3 flex gap-6 border">
                                       <div className="flex-1 space-y-2">
                                         <div className="font-medium text-slate-700 pb-1 border-b mb-2">当前工作台模型</div>
                                         <div className="font-mono text-[11px] space-y-1">
                                           <div className="text-slate-500">modelCode (型号编码): Text</div>
                                           <div className="pl-4">index: <span className="line-through text-slate-400">None</span></div>
                                           <div className="pl-4">constraint: <span className="line-through text-slate-400">NotNull</span></div>
                                         </div>
                                       </div>
                                       <div className="flex-1 border-l pl-6 border-slate-200 space-y-2">
                                         <div className="font-medium text-blue-700 pb-1 border-b border-blue-100 mb-2">导入的 .schema 文件</div>
                                         <div className="font-mono text-[11px] space-y-1">
                                           <div className="text-blue-800 font-semibold">modelCode (型号编码): Text</div>
                                           <div className="pl-4 text-emerald-600 font-bold bg-emerald-50 inline-block px-1 rounded">index: Text</div><br/>
                                           <div className="pl-4 text-emerald-600 font-bold bg-emerald-50 inline-block px-1 rounded mt-1">constraint: NotNull,Unique</div>
                                         </div>
                                       </div>
                                    </div>
                                    <div className="flex gap-2 items-center">
                                       <Button size="sm" className="h-7 text-xs bg-amber-100 text-amber-800 hover:bg-amber-200 shadow-none font-medium">使用导入文件配置 (覆盖约束)</Button>
                                       <Button variant="outline" size="sm" className="h-7 text-xs text-slate-600 shadow-none">保留工作台原有配置</Button>
                                       <Button variant="outline" size="sm" className="h-7 text-xs text-slate-500 border-dashed">重命名导入属性</Button>
                                    </div>
                                 </div>
                              </div>
                              {/* Conflict Row 2 */}
                              <div className="p-4 flex items-start gap-4 hover:bg-slate-50/50">
                                 <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                                 <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-semibold">关系增量合并：包含BOM件 (hasBOMPart)</span>
                                      <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">目标实体一致，安全追加</Badge>
                                    </div>
                                    <p className="text-xs text-slate-500 mb-2">已存在的实体 <span className="font-mono bg-slate-100 px-1 rounded">ProductModel</span> 与 <span className="font-mono bg-slate-100 px-1 rounded">BOMPart</span>，将安全注入本条新发现的关系拓扑连线。</p>
                                    <div className="flex gap-2">
                                       <Button size="sm" className="h-7 text-xs bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 shadow-none">勾选合并</Button>
                                       <Button variant="outline" size="sm" className="h-7 text-xs text-slate-600 shadow-none">跳过此关系注入</Button>
                                    </div>
                                 </div>
                              </div>`);

c = c.replace('已成功将文件 Schema 合并入当前建模工作台！', '已成功将 .schema 建模文件合并入当前工作台！');

fs.writeFileSync('src/pages/SchemaDesign.tsx', c);
console.log("Success");
