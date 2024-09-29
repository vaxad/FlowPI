import { NextRequest, NextResponse } from 'next/server';
import archiver from "archiver";
import { Entity } from '@/lib/types/project';
import { attributeTypeToPrismaType, ensureRelations, ensureUserModel, generateRelationField, handleConstraints } from '@/lib/maps/project';
import { GenerateFormData } from '@/lib/types/generate-form';
import { Readable } from 'stream';

// POST /api/generate
export async function POST(req: NextRequest) {
  const body: GenerateFormData =  await req.json();
  let { entities, relations } =  body
  const { auth, name, description } =  body
  
  const archive = archiver('zip', { zlib: { level: 9 } });
  relations = ensureRelations(relations);
  
  const stream = new Readable({
    read() {}
  });

  archive.on('data', (chunk) => {
    stream.push(chunk); 
  });

  archive.on('end', () => {
    stream.push(null); 
  });


  if(auth){
    entities = ensureUserModel(entities);
    const middlewareContent = 
    `import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'secretkey';
const COOKIE_NAME = 'token';

// Middleware to check authentication based on JWT token in cookies
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies[COOKIE_NAME];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Attach user data to request object
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

export default authMiddleware;`;

    archive.append(middlewareContent, { name: `src/middleware/auth.js` });
  }

  let prismaSchema = `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mongodb"
  url      = env("DATABASE_URL")
}\n\n`;

entities.forEach((entity: Entity) => {
    prismaSchema += `model ${entity.name} {\n id  String  @id @default(auto()) @map("_id") @db.ObjectId\n`;

    entity.attributes.forEach((attr) => {
        prismaSchema += `  ${attr.name} ${attributeTypeToPrismaType(attr.type)}${handleConstraints(attr)}\n`;
      });

    relations
      .filter((relation) => relation.from === entity.name)
      .forEach((relation) => {
        prismaSchema += `  ${generateRelationField(relation)}\n`;
      });

    prismaSchema += '}\n\n';
  });

  archive.append(prismaSchema, { name: `prisma/schema.prisma` });

entities.forEach((entity) => {
  const entityLower = entity.name.toLowerCase();
  let routeFileContent = `
import express from 'express';
import { PrismaClient } from '@prisma/client';
${auth ? `import authMiddleware from '../middleware/auth.js';` : ''}
const prisma = new PrismaClient();
const router = express.Router();

// CRUD API for ${entity.name}
router.get('/', ${auth ? "authMiddleware, " : ""}async (req, res) => {
  try {
    const ${entityLower}s = await prisma.${entityLower}.findMany();
    res.json(${entityLower}s);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while fetching ${entityLower}s' });
  }
});

router.post('/', ${auth ? "authMiddleware, " : ""}async (req, res) => {
  try {
    const ${entityLower} = await prisma.${entityLower}.create({
      data: req.body,
    });
    res.json(${entityLower});
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while creating a ${entityLower}' });
  }
});

router.put('/:id', ${auth ? "authMiddleware, " : ""}async (req, res) => {
  try {
    const { id } = req.params;
    const ${entityLower} = await prisma.${entityLower}.update({
      where: { id: Number(id) },
      data: req.body,
    });
    res.json(${entityLower});
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while updating the ${entityLower}' });
  }
});

router.delete('/:id', ${auth ? "authMiddleware, " : ""}async (req, res) => {
  try {
    const { id } = req.params;
    const ${entityLower} = await prisma.${entityLower}.delete({
      where: { id: Number(id) },
    });
    res.json(${entityLower});
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while deleting the ${entityLower}' });
  }
});
`;

if (auth && entityLower === 'user') {
    routeFileContent += `
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'secretkey';
const COOKIE_NAME = 'token';

router.post('/signup', async (req, res) => {
  try {
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
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred during signup' });
  }
});

router.post('/login', async (req, res) => {
  try {
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
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred during login' });
  }
});

router.get('/getMe', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while fetching user data' });
  }
});

export default router;
`;
  } else {
    routeFileContent += `\nexport default router;`;
  }

archive.append(routeFileContent, { name: `src/routes/${entityLower}.js` });

});

let appJs = `
import {config} from "dotenv"
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';

config({
    path: '.env'
})
const app = express();
app.use(express.json());
app.use(cookieParser()); 
app.use(cors());

`;

entities.forEach((entity) => {
  const entityLower = entity.name.toLowerCase();
  appJs += `// Route for ${entity.name}
import ${entityLower}Router from './routes/${entityLower}.js';
app.use('/${entityLower}', ${entityLower}Router);
`;
});

appJs += `
const port = process.env.PORT || 3000
app.listen(port, () => {
console.log(\`Server is running on port \${port}\`);
});
`;

archive.append(appJs, { name: `src/app.js` });

  const packageJson = `{
  "name": "generated-express-app",
  "description": "${description || "Generated by FlowPI"}",
  "version": "1.0.0",
  "type": "module",
  "main": "src/app.js",
  "scripts": {
    "start": "node src/app.js",
    "dev": "nodemon src/app.js"
  },
  "dependencies": {
    "@prisma/client": "^5.20.0",
    "bcryptjs": "^2.4.3",
    "cookie-parser": "^1.4.6",
    "dotenv": "^16.4.5",
    "cors": "^2.8.5",
    "express": "^4.21.0",
    "jsonwebtoken": "^9.0.2",
    "prisma": "^5.20.0"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/cookie-parser": "^1.4.7",
    "@types/express": "^5.0.0",
    "@types/cors": "^2.8.17",
    "@types/jsonwebtoken": "^9.0.7"
  }
}
`;

archive.append(packageJson, { name: 'package.json' });

const readmeContent = `# ${name}` + "\n\nThis is an auto-generated backend API project using Express.js and Prisma. The project provides a CRUD API for multiple entities and optional authentication features.\n\n## Prerequisites\n\nBefore setting up the project, make sure you have the following tools installed:\n\n- [Node.js](https://nodejs.org/) (v16.x or higher recommended)\n- [npm](https://www.npmjs.com/get-npm) or [yarn](https://yarnpkg.com/) (Choose one)\n- [Prisma](https://www.prisma.io/) CLI for database migrations and management.\n\n---\n\n## Getting Started\n\n### 1. Install Dependencies\n\nInstall the necessary Node.js packages by running:\n\n```bash\nnpm install\n```\n\nOr if you're using Yarn:\n\n```bash\nyarn install\n```\n\n### 2. Set Up Environment Variables\n\nCreate a `.env` file in the root of the project directory. You can base it on the provided `.env.example` file.\n\n```bash\ncp .env.example .env\n```\n\nMake sure to update the following variables in the `.env` file:\n\n- `DATABASE_URL`: Your database connection string. If you're using a Dockerized PostgreSQL database, it might look like this:\n\n```\nDATABASE_URL=\"postgresql://user:password@some-project-id:5432/mydb\"\n```\n\n- `JWT_SECRET`: The secret key for signing JWT tokens.\n\nExample `.env` file:\n\n```env\nDATABASE_URL=\"mongodb://user:password@localhost:5432/mydb\"\nJWT_SECRET=\"your_secret_key_here\"\n```\n\n### 3. Set Up the Database (MongoDB)\n\nAfter you database is set up, run the Prisma migrations to initialize your database:\n\n```bash\nnpx prisma generate\n```\n\nThis will create the necessary tables based on the defined Prisma schema.\n\n### 4. Start the Development Server\n\nOnce everything is set up, you can start the development server with the following command (you'll need `nodemon` for this [`npm i -g nodemon`]):\n\n```bash\nnpm run dev\n```\n\nOr, if using Yarn:\n\n```bash\nyarn dev\n```\n\nBy default, the server will run at `http://localhost:3000`.\n\n### 5. Prisma Studio (Optional)\n\nIf you want to manage your database records via a visual interface, you can use Prisma Studio:\n\n```bash\nnpx prisma studio\n```\n\n### 6. Run in Production\n\nTo run the app in production, start the app:\n\n```bash\nnpm start\n```\n\nOr, using Yarn:\n\n```bash\nyarn start\n```\n\n## API Routes\n\nThe generated backend provides the following CRUD routes for the entities:\n\n- `GET /api/{entity}`: Fetch all records of a given entity\n- `POST /api/{entity}`: Create a new record for a given entity\n- `PUT /api/{entity}/:id`: Update a specific record by ID\n- `DELETE /api/{entity}/:id`: Delete a specific record by ID\n\n> Authentication may be required for some routes if the `auth` option is enabled.\n\n### User Authentication Routes\n\nIf authentication was enabled, additional routes for user management will be available:\n\n- `POST /api/user/signup`: Sign up a new user\n- `POST /api/user/login`: Log in an existing user\n- `GET /api/user/getMe`: Get the details of the authenticated user (requires JWT)\n\n### Authentication Middleware\n\nIf your project has authentication enabled, the generated code uses JWT-based authentication and an `authMiddleware` to protect routes. Make sure the `JWT_SECRET` is set in your `.env` file for token generation and validation.\n\n## Testing the API\n\nTo test your API, you can use tools like [Postman](https://www.postman.com/) or [Insomnia](https://insomnia.rest/).\n\nFor example:\n\n- To fetch all records of an entity, send a `GET` request to `http://localhost:3000/api/{entity}`.\n- For authentication routes, send a `POST` request to `http://localhost:3000/api/user/signup` or `http://localhost:3000/api/user/login` with `email` and `password` in the request body.\n\n## Migrations and Prisma\n\nWhen you modify your database schema in `prisma/schema.prisma`, apply the changes using:\n\n```bash\nnpx prisma migrate dev --name migration_name\n```\n\nThis will generate the necessary migration files and update your database schema.\n\n## Scripts\n\n- `npm run dev` - Start the development server\n- `npm start` - Start production server\n- `np prisma generate` - Generate tables for given schema\n- `npx prisma migrate dev` - Run Prisma migrations for development\n- `npx prisma studio` - Open Prisma Studio to manage database records visually\n\n## Deployment\n\nTo deploy the project to production, you'll need to set up your environment variables for production, ensure your database is accessible. Then use a service like [Render](https://render.com/) or deploy the project to [Railway](https://railway.app/).\n"

archive.append(readmeContent, { name: 'README.md' });

const envContent = `DATABASE_URL="mongodb://localhost:27017/${name}"\nJWT_SECRET="secretkey"\nPORT=5001`;

archive.append(envContent, { name: '.env.example' });

archive.finalize();

  try {
    return new NextResponse(
      new ReadableStream({
        start(controller) {
          stream.on('data', (chunk) => {
            controller.enqueue(chunk);
          });
  
          stream.on('end', () => {
            controller.close();
          });
  
          stream.on('error', (err) => {
            controller.error(err); 
          });
        },
      }),
      {
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename=${name}.zip`,
        },
      }
    );
  } catch (error) {
    console.error('Error while generating backend:', error);
    NextResponse.json({ error: 'Failed to generate backend' });
  }
}
