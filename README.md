# Server Send Event

服务端向客户端推送消息。

## 服务端

服务端采用长连接的方式。

```js
// 响应头
"Content-Type": "text/event-stream",
Connection: "keep-alive",
"Cache-Control": "no-cache",
```

## 客户端

客户端使用 EventSource 接收通知。

```js
// 接收服务端的通知

const events = new EventSource("/events");
events.onmessage = (event) => {
  const parsedData = JSON.parse(event.data);
  setFacts((facts) => facts.concat(parsedData));
};
```

## 启动服务

启动服务

> pnpm install
> pnpm serve

浏览器打开多个 Tab 页，访问地址：

> http://127.0.0.1:3001/web/index.html

## 参看文献

- [How To Use Server-Sent Events in Node.js to Build a Realtime App](https://www.digitalocean.com/community/tutorials/nodejs-server-sent-events-build-realtime-app)
- [MDN DOC](https://developer.mozilla.org/zh-CN/docs/Web/API/Server-sent_events/Using_server-sent_events#%E4%BA%8B%E4%BB%B6%E6%B5%81%E6%A0%BC%E5%BC%8F)
