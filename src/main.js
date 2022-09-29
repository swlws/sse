const path = require("path");
var restify = require("restify");

var server = restify.createServer();
server.use(restify.plugins.queryParser({ mapParams: false }));
server.use(restify.plugins.bodyParser());

const staticDir = path.resolve(__dirname, "web");
server.get("/web/*", restify.plugins.serveStaticFiles(staticDir));

let clients = [];
let facts = [];

server.get("/status", function (request, response, next) {
  response.json(clients.map((item) => item.id));
  next();
});

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

server.post("/fact", function (request, response, next) {
  const newFact = request.body;
  facts.push(newFact);

  clients.forEach((client) => {
    client.response.write(`data: ${JSON.stringify(newFact)}\n\n`);
  });

  response.json({ r0: 0, r1: "" });
});

server.listen(3001, "127.0.0.1", function () {
  console.log("SSE listening at %s", server.url);
});
