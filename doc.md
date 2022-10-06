# 使用 SSE 实现消息推送

Server-Sent Events (SSE)是基于 HTTP 实现的，H5 标准中可以使用 EventSource 连接到服务、并接收服务端的通知。本文介绍，如何通过 SSE 实现一个简单的即时通信。

## 一、服务端实现

使用 Node.js 实现一个 SSE 服务。使用基础服务框架`restify`，构建简单服务。

### 1.1 注册客户端

客户端向服务端注册一个连接。

```js
let clients = [];

server.get("/events", function (request, response, next) {
  const clientId = Date.now();
  request.on("close", () => {
    console.log(`${clientId} Connection closed`);
    clients = clients.filter((client) => client.id !== clientId);
  });

  clients.push({
    id: clientId,
    response,
  });

  response.set({
    "Content-Type": "text/event-stream",
    Connection: "keep-alive",
    "Cache-Control": "no-cache",
  });

  const data = `data: ${JSON.stringify(facts)}\n\n`;
  response.write(data);
});
```

业务：

- 服务器端发送的响应内容应该使用值为`text/event-stream` 的 MIME 类型。
- 每个通知以文本块形式发送，并以`一对换行符`结尾。
- 为`request`注册`close`事件，当客户端关闭连接时，服务端需要注销 client。

### 1.2 推送消息

当客户端向服务端发送一条消息后，服务端主动将这条消息推送给所有注册的客户端。

```js
server.post("/fact", function (request, response, next) {
  const newFact = request.body;
  facts.push(newFact);

  clients.forEach((client) => {
    client.response.write(`data: ${JSON.stringify(newFact)}\n\n`);
  });

  response.json({ r0: 0, r1: "" });
});
```

### 1.3 事件流格式

事件流仅仅是一个简单的文本数据流，文本应该使用 UTF-8 格式的编码。每条消息后面都由一个空行作为分隔符。以冒号开头的行为注释行，会被忽略。

每条消息是由多个字段组成的，每个字段由字段名，一个冒号，以及字段值组成。

| 字段  | 描述                                                                                                                                                                                                                                                                                  |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| event | 事件类型。如果指定了该字段，则在客户端接收到该条消息时，会在当前的 EventSource 对象上触发一个事件，事件类型就是该字段的字段值，可以使用 addEventListener() 方法在当前 EventSource 对象上监听任意类型的命名事件，如果该条消息没有 event 字段，则会触发 onmessage 属性上的事件处理函数. |
| data  | 消息的数据字段。如果该条消息包含多个 data 字段，则客户端会用换行符把它们连接成一个字符串来作为字段值.                                                                                                                                                                                 |
| id    | 事件 ID，会成为当前 EventSource 对象的内部属性最后一个事件 ID 的属性值。                                                                                                                                                                                                              |
| retry | 一个整数值，指定了重新连接的时间 (单位为毫秒),如果该字段值不是整数，则会被忽略。                                                                                                                                                                                                      |

除了上面规定的字段名，其他所有的字段名都会被忽略。

## 二、客户端实现

```js
const [facts, setFacts] = useState([]);
const [listening, setListening] = useState(false);

useEffect(() => {
  if (!listening) {
    const events = new EventSource("/events");

    events.onmessage = (event) => {
      const parsedData = JSON.parse(event.data);

      setFacts((facts) => facts.concat(parsedData));
    };

    setListening(true);
  }
}, [listening, facts]);
```

客户端使用`EventSource`，向服务端注册，同时使用`onmessage`事件接收服务端的推送。

## 三、演示

浏览器同时打开多个 Tab 页面（最大限制 6 个），在其中一个 Tab 页中发送一条消息，其它的 Tab 页可以接收到消息。

## 四、源码

[源码](https://github.com/swlws/sse)
