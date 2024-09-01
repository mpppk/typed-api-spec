// Import the framework and instantiate it
import Fastify from "fastify";
import {
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider,
} from "fastify-type-provider-zod";
import { pathMap } from "../../express/zod/spec";
import { toRoutes } from "../../../src/fastify/zod";
const fastify = Fastify({
  logger: true,
});

fastify.setValidatorCompiler(validatorCompiler);
fastify.setSerializerCompiler(serializerCompiler);
const server = fastify.withTypeProvider<ZodTypeProvider>();

const routes = toRoutes(pathMap);
server.get(
  "/users",
  {
    schema: routes["/users"]["get"]["schema"],
  },
  async (request) => {
    return { userNames: [`page${request.query.page}#user1`] };
  },
);

server.route({
  ...routes["/users"]["get"],
  handler: async (request) => {
    const page = request.query.page;
    return { userNames: [`page${page}#user1`] };
  },
});

(async () => {
  try {
    await fastify.listen({ port: 3000 });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
})();
