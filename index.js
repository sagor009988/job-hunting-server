const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const app = express();
require('dotenv').config();
const port = process.env.PORT || 5000;

// midlewares
app.use(cors({
    origin: ['https://job-seeking-web.web.app', 'http://localhost:5173'],
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// own midlewares
const verify = async (req, res, next) => {
    const token = await req.cookies?.token;
    if (!token) {
        res.status(401).send({ status: 'unAuthorized access', code: '401' })
        return
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decode) => {
        if (error) {
            res.status(401).send({ status: 'unAuthorized access', code: '401' })
            return
        } else {
            console.log(decode);
        }
    })
    next();
}

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.dejlh8b.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // await client.connect();

        const jobCollection = client.db("jobPortal").collection('jobs');
        const categoriesCollection = client.db("jobPortal").collection('categories');
        const blogCollection = client.db("jobPortal").collection('blogs');
        const appliedCollection = client.db("jobPortal").collection('applied');


        app.post('/jobs', async (req, res) => {
            const products = req.body;
            const result = await jobCollection.insertOne(products);
            res.send(result);

        })

        // jobs api
        app.get('/jobs', async (req, res) => {
            const result = await jobCollection.find().toArray();
            res.send(result);
        })
        // jobs category api
        app.get('/categories', async (req, res) => {
            const result = await categoriesCollection.find().toArray();
            res.send(result);
        })

        // show jobs category base
        app.get('/jobs/:category', async (req, res) => {
            const category = req.params.category;
            const query = { category: category }
            const result = await jobCollection.find(query).toArray();
            res.send(result);
        })

        app.get('/job/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await jobCollection.findOne(query);
            res.send(result);
        })

        // my job
        app.get('/myjobs', verify, async (req, res) => {
            let query = {};
            if (req.query?.email) {
                query = { postEmail: req.query?.email }
            }
            const result = await jobCollection.find(query).toArray();
            res.send(result);
        });

        // applied related api........................................

        // applied job
        app.post('/newapplied', async (req, res) => {
            const applied = req.body;
            const result = await appliedCollection.insertOne(applied);
            res.send(result);

        })

        // applied job user email base
        app.get('/appliedjob', verify, async (req, res) => {
            let query = {};
            if (req.query?.email) {
                query = { candidateEamil: req.query?.email }
            }
            const result = await appliedCollection.find(query).toArray();
            res.send(result);
        });

        // // update applide number
        app.put('/count/:id', async (req, res) => {
            const id = req.params.id;
            const data = req.body;
            const options = { upsert: true };
            const filter = { _id: new ObjectId(id) };
            const update = {
                $set: {
                    applied: data.newCount
                }
            };
            const result = await jobCollection.updateOne(filter, update, options);
            res.send(result);
        });


        // delete booking
        app.delete('/jobsDelete/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = jobCollection.deleteOne(query);
            res.send(result);
        })


        // update applide number
        app.put('/jobs/:id', async (req, res) => {
            const id = req.params.id;
            const data = req.body;
            const options = { upsert: true };
            const filter = { _id: new ObjectId(id) };
            const update = {
                $set: {
                    jobTitle: data?.jobTitle,
                    category: data?.category,
                    postbanner: data?.postbanner,
                    salary: data?.salary,
                    description: data?.description,
                    gender: data?.gender,
                    responsibilities: data?.responsibilities,
                    expirationDate: data?.newExpirationDate,
                    eduRequirements: data?.eduRequirements,
                    statement: data?.statement,
                    location: data?.location
                }
            };
            const result = await jobCollection.updateOne(filter, update, options);
            res.send(result);
        });

        // jobs api
        app.get('/blogs', async (req, res) => {
            const result = await blogCollection.find().toArray();
            res.send(result);
        })

        app.get('/blogs/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await blogCollection.findOne(query);
            res.send(result);
        })

        // jwt related api
        app.post('/jwt', async (req, res) => {
            const body = req.body;
            const token = jwt.sign(body, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '10h' });

            const expirationDate = new Date();
            expirationDate.setDate(expirationDate.getDate() + 7);
            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',

            }).send({ msg: 'succeed' });
        })



        // delete cookie
        app.post('/logout', async (req, res) => {
            const user = req.body;
            res.clearCookie('token', { maxAge: 0 }).send({ message: 'success' })
        })


        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // await client.close(); 
    }
}

run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Server is running now');
});

app.listen(port, () => {
    console.log(`My server is running now on port, ${port}`);
});
