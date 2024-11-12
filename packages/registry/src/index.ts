import express, { Express, Request, Response } from 'express';
import { ApiResponse, Component } from './types';
import { getComponents } from './components';

const app: Express = express();
const port: number = 1923;

let components: Component[];

app.get('/', async (_req: Request, res: Response) => {
  const response: ApiResponse = {
    components: components,
  };
  
  res.json(response);
});

app.listen(port, async () => {
  components = await getComponents()
  console.log(`Registry running on port ${port}`);
});
