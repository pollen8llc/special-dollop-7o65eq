### **Step-by-Step Plan for Your Project**

#### **1️⃣ Set Up Your Remix Project with Railway**

1. **Create a Remix App**

   ```
   sh
   ```

   CopyEdit

   `npx create-remix@latest linkedin-profiles-app cd linkedin-profiles-app`

2. **Choose the Stack Options**:

   - Deploy: Choose **Railway**

   - Database: Select **PostgreSQL**

   - UI: Select **Remix App Server**

   - CSS: **Tailwind CSS**

3. **Initialize a Git Repository**

   ```
   sh
   ```

   CopyEdit

   `git init git add . git commit -m "Initial commit"`

4. **Push to GitHub** (Required for Railway Deployment)

   ```
   sh
   ```

   CopyEdit

   `gh repo create linkedin-profiles-app --public --source=. --push`

----------

#### **2️⃣ Set Up PostgreSQL on Railway**

1. Go to **[Railway.app](https://railway.app)** → Create a new project.

2. Add a **PostgreSQL Database Plugin**.

3. Copy the **Database URL** from Railway.

4. Create a **`.env` file** in your project root and add:

   ```
   env
   ```

   CopyEdit

   `DATABASE_URL="your_railway_database_url"`

----------

#### **3️⃣ Install Dependencies**

Run the following:

```
sh
```

CopyEdit

npm install @clerk/remix @clerk/clerk-sdk-node framer-motion @prisma/client remix-auth npm install -D prisma

----------

#### **4️⃣ Set Up Clerk for LinkedIn Authentication**

1. Go to **[Clerk.dev](https://clerk.dev/)** and create an account.

2. Set up a new project and enable **LinkedIn OAuth**.

3. Copy the **Frontend API Key** and **Secret Key** into `.env`:

   ```
   env
   ```

   CopyEdit

   `CLERK_FRONTEND_API="your_clerk_frontend_api" CLERK_SECRET_KEY="your_clerk_secret_key"`

4. Update `entry.server.tsx` to wrap Remix with Clerk:

   ```
   tsx
   ```

   CopyEdit

   `import { ClerkApp } from "@clerk/remix"; export default ClerkApp();`

5. Create an authentication layout in `app/routes/sign-up.tsx`:

   ```
   tsx
   ```

   CopyEdit

   `import { SignIn } from "@clerk/remix"; export default function SignUp() { return <SignIn path="/sign-up" />; }`

----------

#### **5️⃣ Set Up Prisma with PostgreSQL**

1. Initialize Prisma:

   ```
   sh
   ```

   CopyEdit

   `npx prisma init`

2. Edit `prisma/schema.prisma` to define the **User and Profile** models:

   ```
   prisma
   ```

   CopyEdit

   `model User { id String @id @default(uuid()) email String @unique name String? profiles Profile[] } model Profile { id String @id @default(uuid()) name String picture String userId String user User @relation(fields: [userId], references: [id]) }`

3. Push to the database:

   ```
   sh
   ```

   CopyEdit

   `npx prisma db push`

----------

#### **6️⃣ Populate Dummy Profiles on First Login**

1. Create a **profile seed script** (`prisma/seed.ts`):

   ```
   ts
   ```

   CopyEdit

   ```` import { PrismaClient } from "@prisma/client"; const prisma = new PrismaClient(); const dummyProfiles = Array.from({ length: 30 }, (_, i) => ({ name: `User ${i + 1}`, picture: `https://randomuser.me/api/portraits/men/${i % 10}.jpg`, })); async function main() { await prisma.profile.createMany({ data: dummyProfiles }); } main() .catch(e => console.error(e)) .finally(() => prisma.$disconnect()); ````

2. Run the seeding command:

   ```
   sh
   ```

   CopyEdit

   `npx prisma db seed`

----------

#### **7️⃣ Create the Profile Gallery Page**

1. In `app/routes/profiles.tsx`, fetch profiles from the database:

   ```
   tsx
   ```

   CopyEdit

   `import { json, LoaderFunction } from "@remix-run/node"; import { useLoaderData } from "@remix-run/react"; import { PrismaClient } from "@prisma/client"; import { motion } from "framer-motion"; const prisma = new PrismaClient(); export const loader: LoaderFunction = async () => { const profiles = await prisma.profile.findMany(); return json(profiles); }; export default function Profiles() { const profiles = useLoaderData<typeof loader>(); return ( <div className="grid grid-cols-3 gap-6 p-10"> {profiles.map((profile, index) => ( <motion.div key={profile.id} initial={{ opacity: 0, scale: 0.8, rotateY: 30 }} animate={{ opacity: 1, scale: 1, rotateY: 0 }} whileHover={{ scale: 1.1, rotateY: 5 }} transition={{ duration: 0.5, ease: "easeInOut" }} className="bg-white rounded-lg p-5 shadow-lg" > <img src={profile.picture} alt={profile.name} className="w-24 h-24 rounded-full mx-auto" /> <h3 className="text-center mt-2">{profile.name}</h3> </motion.div> ))} </div> ); }`

----------

#### **8️⃣ Deploy to Railway**

1. Push your changes to GitHub:

   ```
   sh
   ```

   CopyEdit

   `git add . git commit -m "Set up authentication and profiles" git push origin main`

2. Go to **Railway.app** → New Project → Deploy from GitHub.

3. Add environment variables (`DATABASE_URL`, `CLERK_FRONTEND_API`, `CLERK_SECRET_KEY`).

4. Deploy and get your live URL! 🎉