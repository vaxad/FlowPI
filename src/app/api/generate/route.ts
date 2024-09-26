import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { NextRequest, NextResponse } from 'next/server';
import archiver from "archiver";
import { Entity, Relation } from '@/lib/types/project';
import { attributeTypeToPrismaType, ensureUserModel, generateRelationField, handleConstraints } from '@/lib/maps/project';
const execPromise = promisify(exec);

const baseDir = path.resolve(process.cwd(), 'generated-backend'); // Directory where backend will be generated

const publicDir = path.resolve(process.cwd(), 'public'); 
const zipFilePath = path.join(publicDir, 'generated-backend.zip');  // Path for the zip file

const srcDir = path.join(baseDir, 'src');
if (!fs.existsSync(srcDir)) {
  fs.mkdirSync(srcDir);
}

async function zipFolder(sourceFolder: string, outPath: string) {
    const output = fs.createWriteStream(outPath);
    const archive = archiver('zip', { zlib: { level: 9 } });
  
    return new Promise((resolve, reject) => {
      archive.on('error', err => reject(err));
      output.on('close', () => resolve(true));
  
      archive.pipe(output);
      archive.directory(sourceFolder, false, (file) => {
        if(file.name.includes('node_modules')){
            return false;
        }else{
            return file;
        }
      });
      archive.finalize();
    });
  }
export async function POST(req: NextRequest) {
  let { entities, relations, auth }: {entities: Entity[], relations: Relation[], auth:boolean} =  await req.json();

  if(auth){
    entities = ensureUserModel(entities);
    const middlewareContent = 
    `
import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'secretkey';
const COOKIE_NAME = 'token';

// Middleware to check authentication based on JWT token in cookies
const authMiddleware = async (req, res, next) => {
  const token = req.cookies[COOKIE_NAME];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Attach user data to request object
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

export default authMiddleware;
    `;
    const middlewareDirectory = path.join(srcDir, 'middleware');
    if (!fs.existsSync(middlewareDirectory)) {
        fs.mkdirSync(middlewareDirectory);
    }
    fs.writeFileSync(path.join(middlewareDirectory, "auth.js"), middlewareContent);
  }

  console.log(entities)

  // Step 1: Create base directory for generated backend
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir);
  }

  // Step 2: Generate Prisma schema
  let prismaSchema = `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mongodb"
  url      = env("BACKEND_DATABASE_URL")
}\n\n`;

entities.forEach((entity: Entity) => {
    prismaSchema += `model ${entity.name} {\n id  String  @id @default(auto()) @map("_id") @db.ObjectId\n`;

    // Generate attributes
    entity.attributes.forEach((attr) => {
        prismaSchema += `  ${attr.name} ${attributeTypeToPrismaType(attr.type)}${handleConstraints(attr)}\n`;
      });

    // Add relations if applicable
    relations
      .filter((relation) => relation.from === entity.name)
      .forEach((relation) => {
        prismaSchema += `  ${generateRelationField(relation)}\n`;
      });

    prismaSchema += '}\n\n';
  });

  const prismaDir = path.join(baseDir, 'prisma');
  if (!fs.existsSync(prismaDir)) {
    fs.mkdirSync(prismaDir);
  }
  fs.writeFileSync(path.join(prismaDir, 'schema.prisma'), prismaSchema);

// Step 3: Generate routes for each entity

const routesDir = path.join(srcDir, 'routes');
if (!fs.existsSync(routesDir)) {
  fs.mkdirSync(routesDir);
}

entities.forEach((entity) => {
  const entityLower = entity.name.toLowerCase();
  let routeFileContent = `
import express from 'express';
import { PrismaClient } from '@prisma/client';
${auth ? `import authMiddleware from '../middleware/auth.js';` : ''}
const prisma = new PrismaClient();
const router = express.Router();

// CRUD API for ${entity.name}
router.get('/', async (req, res) => {
const ${entityLower}s = await prisma.${entityLower}.findMany();
res.json(${entityLower}s);
});

router.post('/', async (req, res) => {
const ${entityLower} = await prisma.${entityLower}.create({
  data: req.body,
});
res.json(${entityLower});
});

router.put('/:id', async (req, res) => {
const { id } = req.params;
const ${entityLower} = await prisma.${entityLower}.update({
  where: { id: Number(id) },
  data: req.body,
});
res.json(${entityLower});
});

router.delete('/:id', async (req, res) => {
const { id } = req.params;
const ${entityLower} = await prisma.${entityLower}.delete({
  where: { id: Number(id) },
});
res.json(${entityLower});
});
`;

if (auth && entityLower === 'user') {
    routeFileContent += `
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'secretkey';
const COOKIE_NAME = 'token';

router.post('/signup', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    return res.status(409).json({ error: 'User with this email already exists' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await prisma.user.create({
    data: {
      ...req.body,
      email,
      password: hashedPassword
    }
  });

  const token = jwt.sign({ id: newUser.id, email: newUser.email }, JWT_SECRET, { expiresIn: '1d' });

  res.cookie(COOKIE_NAME, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });

  const { password: _, ...userWithoutPassword } = newUser;
  return res.status(201).json(userWithoutPassword);
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1d' });

  res.cookie(COOKIE_NAME, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });

  const { password: _, ...userWithoutPassword } = user;
  return res.json(userWithoutPassword);
});

router.get('/getMe', authMiddleware, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const { password: _, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});
export default router;
`;
  } else {
    routeFileContent += `
    export default router;
    `;
  }
// GetMe endpoint to fetch the logged-in user’s details based on JWT


  fs.writeFileSync(path.join(routesDir, `${entityLower}.js`), routeFileContent);
});

// Step 4: Generate app.js and set up routers
let appJs = `
import {config} from "dotenv"
import express from 'express';

config({
    path: '.env'
})
const app = express();
app.use(express.json());

`;

entities.forEach((entity) => {
  const entityLower = entity.name.toLowerCase();
  appJs += `// Route for ${entity.name}
import ${entityLower}Router from './routes/${entityLower}.js';
app.use('/${entityLower}', ${entityLower}Router);
`;
});

appJs += `
const port = ${parseInt(process.env.PORT || "3000") + 1}
app.listen(port, () => {
console.log(\`Server is running on port \${port}\`);
});
`;

// Write app.js
fs.writeFileSync(path.join(srcDir, 'app.js'), appJs);


  // Step 4: Generate package.json
  const packageJson = `{
  "name": "generated-express-app",
  "version": "1.0.0",
  "type": "module",
  "main": "src/app.js",
  "scripts": {
    "start": "node src/app.js",
    "dev": "nodemon src/app.js"
  },
  "dependencies": {
    "@prisma/client": "^5.15.0",
    "bcrypt": "^5.1.1",
    "dotenv": "^16.4.5",
    "express": "^4.17.1",
    "jsonwebtoken": "^9.0.2",
    "prisma": "^5.15.0"
  },
  "devDependencies": {
    "@types/bcrypt": "^5.0.2",
    "@types/express": "^5.0.0",
    "@types/jsonwebtoken": "^9.0.7"
  }
}
`;

  fs.writeFileSync(path.join(baseDir, 'package.json'), packageJson);

  // Step 5: Install dependencies and run the backend server
  try {
    await zipFolder(baseDir, zipFilePath);
    await execPromise(`npm install`, { cwd: baseDir });
    await execPromise(`npx prisma generate`, { cwd: baseDir });
    console.log('Prisma schema generated successfully!');
    execPromise(`npm start`, { cwd: baseDir }); // Run the server in background

    return NextResponse.json({ message: 'Backend API generated and running!' });
  } catch (error) {
    console.error('Error while generating backend:', error);
    NextResponse.json({ error: 'Failed to generate backend' });
  }
}
