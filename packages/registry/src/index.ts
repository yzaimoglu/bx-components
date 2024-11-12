import express, { Express, Request, Response } from 'express';
import { ApiResponse, Component } from './types';
import { getComponents, getSingleComponent } from './components';

const app: Express = express();
const port: number = 1923;

let components: Component[];

app.get('/', async (_req: Request, res: Response) => {
  const response: ApiResponse = {
    components: components,
  };
  
  res.json(response);
});

app.get('/:component', async (_req: Request, res: Response) => {
  const response: Component | undefined = getSingleComponent(components, _req.params["component"]);
  if(response === undefined) {
    res.status(404).send();
    return;
  }

  res.json(response);
});

app.listen(port, async () => {
  components = await getComponents()
  console.log(`Registry running on port ${port}`);
});
