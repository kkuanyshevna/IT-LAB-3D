'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const N=require('./network-topology.js');
const add=(s,type)=>N.add(s,type,50,50);
const cable=(s,a,b,ap,bp)=>{
 const result=N.connect(s,a.id,b.id,ap,bp);
 assert.equal(result.ok,true,result.text);
 return result.link;
};
const ip=(node,port,address,gateway='',extra={})=>{
 const result=N.configure(node,port,{ip:address,prefix:'255.255.255.0',gateway,...extra});
 assert.equal(result.ok,true,result.text);
};

test('DHCP leases use the attached switch segment and reject occupied Ethernet ports',()=>{
 const s=N.create(),router=add(s,'router'),sw=add(s,'switch'),pc=add(s,'pc'),server=add(s,'server');
 ip(router,'G0/0','192.168.4.1','',{dhcp:true});
 assert.equal(N.lease(s,pc.id).ok,false);
 cable(s,router,sw);cable(s,sw,pc);cable(s,sw,server);
 assert.equal(N.connect(s,pc.id,router.id).ok,false);
 assert.equal(N.lease(s,pc.id).ok,true);
 assert.equal(N.lease(s,server.id).ok,true);
 assert.equal(N.formatIP(pc.ports.eth0.ip),'192.168.4.100');
 assert.equal(N.formatIP(server.ports.eth0.ip),'192.168.4.101');
 assert.equal(N.formatIP(pc.gateway),'192.168.4.1');
});

test('Ping traverses the router and HTTP separately checks the application service',()=>{
 const s=N.example(),pc=s.nodes.find(node=>node.type==='pc'),server=s.nodes.find(node=>node.type==='server');
 const response=N.test(s,pc.id,'192.168.20.10','http');
 assert.equal(response.ok,true,response.text);
 assert.equal(response.path.length,3);
 server.http=false;
 assert.equal(N.test(s,pc.id,'192.168.20.10').ok,true);
 assert.match(N.test(s,pc.id,'192.168.20.10','http').text,/HTTP.*не включён/);
 N.remove(s,s.nodes.find(node=>node.type==='switch').id);
 assert.equal(N.test(s,pc.id,'192.168.20.10').ok,false);
});

test('two routers need routes in both directions for a cross-subnet reply',()=>{
 const s=N.create(),pc=add(s,'pc'),a=add(s,'router'),b=add(s,'router'),server=add(s,'server');
 cable(s,pc,a);cable(s,a,b);cable(s,b,server);
 ip(pc,'eth0','192.168.1.2','192.168.1.1');
 ip(a,'G0/0','192.168.1.1');ip(a,'G0/1','10.0.0.1');
 ip(b,'G0/0','10.0.0.2');ip(b,'G0/1','192.168.2.1');
 ip(server,'eth0','192.168.2.2','192.168.2.1');
 assert.match(N.test(s,pc.id,'192.168.2.2').text,/Роутер не знает/);
 assert.ok(N.addRoute(a,{destination:'192.168.2.0',prefix:24,via:'10.0.0.2'}).ok);
 assert.match(N.test(s,pc.id,'192.168.2.2').text,/ответ не вернулся/);
 assert.ok(N.addRoute(b,{destination:'192.168.1.0',prefix:24,via:'10.0.0.1'}).ok);
 assert.equal(N.test(s,pc.id,'192.168.2.2').ok,true);
});

test('bad masks and wrong gateways leave the previous address untouched',()=>{
 const s=N.create(),pc=add(s,'pc');
 ip(pc,'eth0','192.168.3.8','192.168.3.1');
 assert.equal(N.configure(pc,'eth0',{ip:'192.168.3.7',prefix:'255.0.255.0'}).ok,false);
 assert.equal(N.configure(pc,'eth0',{ip:'192.168.3.7',prefix:'24',gateway:'10.0.0.1'}).ok,false);
 assert.equal(N.formatIP(pc.ports.eth0.ip),'192.168.3.8');
});
