import express from 'express';
import path from 'path';
import mysql from 'mysql';
import cookieParser from 'cookie-parser';
import ejs from 'ejs';

const __dirname = path.resolve();
const app = express();
const PORT = process.env.PORT || 8800;

const db = mysql.createConnection({
    host: "localhost",
    port: '3307',
    user: 'root',
    password: '',
    database: 'wskmb',
});


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const userPages = {
    demo1: 'page1',
    demo2: 'page2',
};

app.get('/', (req, res) => {
    const usernameCookie = req.cookies.username;

    if (usernameCookie && userPages[usernameCookie]) {
        res.render(userPages[usernameCookie], { username: usernameCookie });
    } else {
        res.sendFile(path.resolve(__dirname, 'static', 'login.html'));
    }
});

app.post('/', (req, res) => {
    const { username, password, rememberMe } = req.body;

    db.query('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], (error, results) => {
        if (error) {
            console.error(error);
            res.status(500).send('Internal Server Error');
            return;
        }

        if (results.length > 0) {
            const authenticatedUser = results[0].username;

            if (rememberMe) {
                res.cookie('username', authenticatedUser, { maxAge: 30 * 24 * 60 * 60 * 1000 });
            }

            if (userPages[authenticatedUser]) {

                db.query('SELECT * FROM api_usage WHERE username = ?', [authenticatedUser], (apiError, apiResults) => {
                    if (apiError) {
                        console.error(apiError);
                        res.status(500).send('Internal Server Error');
                        return;
                    }

                    res.render(userPages[authenticatedUser], { username: authenticatedUser, apiUsage: apiResults });
                });
            } else {
                res.sendFile(path.resolve(__dirname, 'static', 'warning.html'));
            }
        } else {
            res.sendFile(path.resolve(__dirname, 'static', 'warning.html'));
        }
    });
});

app.listen(PORT, () => {
    console.log(`Server is running at ${PORT}`);
});
