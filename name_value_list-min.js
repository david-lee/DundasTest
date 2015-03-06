var nameValue={view:{}};"undefined"===typeof String.replaceAll&&(String.prototype.replaceAll=function(b,c){return this.replace(RegExp(b,"g"),c)});
(function(b){var c=nameValue;c.configs={inputContainerId:"#nv-input-container",inputErrorMsgId:"#input-error-msg",nvListContainerId:"#nv-list-container",nvNavigationId:"#nv-list-navigation",nvListBodyId:"#nv-list-body",nvPairTemplateId:"#nv-pair-template",nvPairXmlTemplateId:"#nv-pair-xml-template",nvTotalCountId:"#total-count",nvExportView:"#nv-export-view",inputDelimiter:"="};c.totalCount=0;c.controller={initialize:function(a){b.extend(c.configs,a);c.view.home.initialize()}};var n=c.view,g=b(c.configs.inputContainerId),
p=g.find(":text"),i=b(c.configs.inputErrorMsgId),d=b(c.configs.nvListContainerId),j=b(c.configs.nvListBodyId),k=b(c.configs.nvTotalCountId),l,q,x=function(){g.hide();d.hide();c.view.exportPair.initialize()},s,m=0,t,r,y=b("tbody");s=function(a){var c=[1,-1],e=[".downarrow",".uparrow"],d=a.target.getAttribute("class");b(b("td."+d).sort(function(a,e){return(b(a).text()>b(e).text()?1:-1)*c[m%2]})).each(function(){t=b(this).parent();y.append(t)});r&&b(r).find("span").hide();r=a.target;b(a.target).find(e[m%
2]).show();b(a.target).find(e[m%2?0:1]).hide();m++};var z=function(){j.find("tbody input:checkbox").each(function(){this.checked=j.find("thead input:checkbox").is(":checked")})},u=function(){var a;a=p.val();i.text("");a=a.split(c.configs.inputDelimiter);if(2!=a.length)return i.text("Please enter the correct delimiter '=' between name and value."),!1;l=b.trim(a[0]);q=b.trim(a[1]);if(!/^[a-z0-9]+$/i.test(l)||!/^[a-z0-9]+$/i.test(q))return i.text("Only alpha-numeric characters are allowed for the name and the value."),
!1;var f=l,e=!1,d;b(c.configs.nvListBodyId).find("tbody tr").each(function(){d=b(this).find(".name-col");if(f===d.text())return e=!0,i.text("There is the same name in the list."),d.css({"background-color":"#FF2222"}),setTimeout(function(){d.css({"background-color":"#FFFFFF"})},1E3),!1});return e?!1:!0},v=function(a){if(!("click"!==a.type&&13!==a.keyCode||!p.val()||!u()))if(!("click"===a.type&&(!p.val()||!u()))){var a=b(c.configs.nvPairTemplateId).html(),f={name:l,value:q},e;for(e in f)a=a.replaceAll("\\{"+
e+"\\}",f[e]);b(a).prependTo("tbody");k.trigger("updateCount",++c.totalCount);d.is(":hidden")&&d.show()}},A=function(a,f){b(f).closest("tr").remove();k.trigger("updateCount",--c.totalCount)},B=function(){j.find("tbody tr input:checked").each(function(){d.trigger("deletePair",this)});0==c.totalCount&&(d.hide(),b("thead input").removeAttr("checked"),b("thead span").hide())};n.home={initialize:function(){g.on("keypress","input",v);g.on("click","#nv-add-button",v);d.on("click","thead input",z);d.on("click",
"#menu-export",x);d.on("click","#menu-delete",B);j.on("click","#name-col-head, #value-col-head",s);d.on("deletePair",A);k.on("updateCount",function(a,b){k.text(b)})},show:function(){g.show();d.show()}};var n=c.view,h=b(c.configs.nvExportView),C={get:function(a){return this[a]()},forEachPair:function(a){var f,e=[];b(c.configs.nvListBodyId).find("tbody tr").each(function(){f=b(this);e.push({name:f.find(".name-col").text(),value:f.find(".value-col").text()})});a(e)},xml:function(){var a=b("<root><pairs></pairs></root>");
this.forEachPair(function(f){var e,d,g;e=0;for(d=f.length;e<d;e++){g=b(c.configs.nvPairXmlTemplateId).html();for(var h in f[e])g=g.replaceAll("\\{"+h+"\\}",f[e][h]);a.find("pairs").append(g)}});return a.html()},csv:function(){var a="";this.forEachPair(function(b){for(var c in b)a+=b[c].name+","+b[c].value+"\n"});return a}},w=function(a){h.find("textarea").val(C.get(a))},D=function(a){a=a.target.id.split("-")[1].toLocaleLowerCase();w(a)},E=function(){h.hide();b("#export-xml").get(0).checked=!0;c.view.home.show()};
n.exportPair={initialize:function(){h.on("click","#nv-export-header span:last",E);h.on("click","#export-xml, #export-csv",D);h.show();w("xml")}};b(document).ready(function(){c.controller.initialize()})})(jQuery);