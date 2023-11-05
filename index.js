const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const app = express();
require('dotenv').config();
const port = process.env.PORT || 5000;

// midlewares
app.use(cors({
    origin: ['https://cheery-chebakia-29ff98.netlify.app', 'http://localhost:5173'],
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

        app.get('/blogs', async (req, res) => {
            const result = await blogCollection.find().toArray();
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
                secure: true,
                expires: expirationDate,
            }).send({ msg: 'succeed' });

        })

        // delete cookie
        app.post('/logout', async (req, res) => {
            const user = req.body;
            res.clearCookie('token', { maxAge: 0 }).send({ message: 'success' })
        })


        // ===========================================================


        // // auth api
        // app.post('/jwt', logger, async (req, res) => {
        //     const user = req.body;
        //     const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
        //     res
        //         .cookie('token', token, {
        //             httpOnly: true,
        //             secure: true,
        //             sameSite: 'none'
        //         })
        //         .send({ success: true });
        // })

        // // delete cookie
        // app.post('/logout', async (req, res) => {
        //     const user = req.body;
        //     res.clearCookie('token', { maxAge: 0 }).send({ message: 'success' })
        // })

        // // services api
        // app.get('/services', logger, async (req, res) => {
        //     const cursor = jobCollection.find();
        //     const result = await cursor.toArray();
        //     res.send(result);
        // })
        // app.get('/services/:id', async (req, res) => {
        //     const id = req.params.id;
        //     const query = { _id: new ObjectId(id) }
        //     const result = await jobCollection.findOne(query);
        //     res.send(result);
        // })

        // // bookings
        // app.post('/bookings', async (req, res) => {
        //     const bookig = req.body;
        //     const result = await bookingsCollection.insertOne(bookig);
        //     res.send(result);
        // })

        // // get bookings
        // app.get('/bookings', logger, varifyToken, async (req, res) => {
        //     // console.log('token from get bookings api:', req.cookies.token);
        //     if (req.query?.email !== req.user.email) {
        //         return res.status(403).send({ message: 'Forbidden access.' })
        //     }
        //     let query = {}
        //     if (req.query?.email) {
        //         query = { email: req.query.email }
        //     }
        //     const result = await bookingsCollection.find(query).toArray();
        //     res.send(result);
        // })

        // // delete booking
        // app.delete('/bookings/:id', async (req, res) => {
        //     const id = req.params.id;
        //     const query = { _id: new ObjectId(id) }
        //     const result = bookingsCollection.deleteOne(query);
        //     res.send(result);
        // })

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
