import express, { Express, Request, Response } from 'express';
import path from 'path';
import { Component } from './types';
import { getComponents, getSingleComponent } from './components';
import { authMiddleware } from './middleware';

const app: Express = express();
const port: number = 1923;

let components: Component[];

// app.use(authMiddleware);

app.get('/', async (_req: Request, res: Response) => {
  res.json(components);
});

app.get('/:component', async (_req: Request, res: Response) => {
  const response: Component | undefined = getSingleComponent(components, _req.params["component"]);
  if (response === undefined) {
    res.status(404).send();
    return;
  }

  res.json(response);
});

app.get('/tailwind/config', async (_req: Request, res: Response) => {
  res.sendFile(path.join(process.cwd(), 'assets', 'tailwind.config.js'));
});

app.use('/angular', express.static(path.join(process.cwd(), '../angular/src/components')))
app.use('/vue', express.static(path.join(process.cwd(), '../vue/src/components')))

app.listen(port, async () => {
  components = await getComponents()
  console.log(`Registry running on port ${port}`);
});


