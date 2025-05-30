// server.js
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const Database = require('better-sqlite3');

const app = express();
const port = process.env.PORT || 5000;
const db = new Database('bookstore.db');

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Створення таблиць у БД
function initDB() {
    db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE,
      password TEXT,
      role TEXT,
      name TEXT
    );

    CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      author TEXT,
      category TEXT,
      price REAL,
      description TEXT,
      image TEXT,
      inStock INTEGER
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      totalAmount REAL,
      shipping TEXT,
      payment TEXT,
      status TEXT,
      date TEXT,
      FOREIGN KEY (userId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      orderId INTEGER,
      bookId INTEGER,
      title TEXT,
      price REAL,
      quantity INTEGER,
      FOREIGN KEY (orderId) REFERENCES orders(id),
      FOREIGN KEY (bookId) REFERENCES books(id)
    );

    CREATE TABLE IF NOT EXISTS manager_account (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      balance REAL
    );
  `);

    // Перевірка наявності запису балансу менеджера
    const managerAccount = db.prepare('SELECT * FROM manager_account LIMIT 1').get();
    if (!managerAccount) {
        db.prepare('INSERT INTO manager_account (balance) VALUES (0)').run();
    }
}

// Ініціалізація БД при запуску сервера
initDB();

// API для авторизації та реєстрації
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE email = ? AND password = ?').get(email, password);

    if (user) {
        res.json({
            success: true,
            user: { id: user.id, email: user.email, role: user.role, name: user.name }
        });
    } else {
        res.status(401).json({ success: false, message: 'Невірний email або пароль' });
    }
});

app.post('/api/register', (req, res) => {
    const { email, password, name, role = 'customer' } = req.body;

    try {
        const existingUser = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Користувач з таким email вже існує' });
        }

        const result = db.prepare('INSERT INTO users (email, password, role, name) VALUES (?, ?, ?, ?)').run(email, password, role, name);
        const userId = result.lastInsertRowid;

        res.json({
            success: true,
            user: { id: userId, email, role, name }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Помилка сервера' });
    }
});

// API для книг
app.get('/api/books', (req, res) => {
    const books = db.prepare('SELECT * FROM books').all();
    res.json(books);
});

app.get('/api/books/:id', (req, res) => {
    const book = db.prepare('SELECT * FROM books WHERE id = ?').get(req.params.id);
    if (book) {
        res.json(book);
    } else {
        res.status(404).json({ success: false, message: 'Книгу не знайдено' });
    }
});

app.post('/api/books', (req, res) => {
    const { title, author, category, price, description, image, inStock } = req.body;

    try {
        const result = db.prepare('INSERT INTO books (title, author, category, price, description, image, inStock) VALUES (?, ?, ?, ?, ?, ?, ?)')
            .run(title, author, category, price, description, image, inStock);

        const newBook = db.prepare('SELECT * FROM books WHERE id = ?').get(result.lastInsertRowid);
        res.json(newBook);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Помилка сервера' });
    }
});

app.put('/api/books/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const { title, author, category, price, description, image, inStock } = req.body;

    try {
        const result = db.prepare('UPDATE books SET title = ?, author = ?, category = ?, price = ?, description = ?, image = ?, inStock = ? WHERE id = ?')
            .run(title, author, category, price, description, image, inStock, id);

        if (result.changes > 0) {
            const updatedBook = db.prepare('SELECT * FROM books WHERE id = ?').get(id);
            res.json(updatedBook);
        } else {
            res.status(404).json({ success: false, message: 'Книгу не знайдено' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Помилка сервера' });
    }
});

app.delete('/api/books/:id', (req, res) => {
    const id = parseInt(req.params.id);

    try {
        const result = db.prepare('DELETE FROM books WHERE id = ?').run(id);

        if (result.changes > 0) {
            res.json({ success: true });
        } else {
            res.status(404).json({ success: false, message: 'Книгу не знайдено' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Помилка сервера' });
    }
});

// API для замовлень
app.post('/api/orders', (req, res) => {
    const { userId, items, totalAmount, shipping, payment } = req.body;

    try {
        const date = new Date().toISOString();

        db.prepare('BEGIN TRANSACTION').run();

        const orderResult = db.prepare('INSERT INTO orders (userId, totalAmount, shipping, payment, status, date) VALUES (?, ?, ?, ?, ?, ?)')
            .run(userId, totalAmount, JSON.stringify(shipping), JSON.stringify(payment), 'Новий', date);

        const orderId = orderResult.lastInsertRowid;

        items.forEach(item => {
            db.prepare('INSERT INTO order_items (orderId, bookId, title, price, quantity) VALUES (?, ?, ?, ?, ?)')
                .run(orderId, item.id, item.title, item.price, item.quantity);
        });

        // Оновлення балансу менеджера
        db.prepare('UPDATE manager_account SET balance = balance + ? WHERE id = 1').run(totalAmount);

        db.prepare('COMMIT').run();

        const newOrder = {
            id: orderId,
            userId,
            items,
            totalAmount,
            shipping,
            payment,
            status: 'Новий',
            date
        };

        res.json({ success: true, order: newOrder });
    } catch (error) {
        db.prepare('ROLLBACK').run();
        res.status(500).json({ success: false, message: 'Помилка сервера' });
    }
});

app.get('/api/orders', (req, res) => {
    const { userId, role } = req.query;

    try {
        let orders = [];

        if (role === 'manager') {
            // Отримання всіх замовлень для менеджера
            orders = db.prepare(`
        SELECT o.*, u.name as userName, u.email as userEmail 
        FROM orders o
        JOIN users u ON o.userId = u.id
      `).all();
        } else if (userId) {
            // Отримання замовлень для конкретного користувача
            orders = db.prepare('SELECT * FROM orders WHERE userId = ?').all(userId);
        } else {
            return res.status(403).json({ success: false, message: 'Доступ заборонено' });
        }

        // Отримання товарів для кожного замовлення
        orders = orders.map(order => {
            const items = db.prepare('SELECT * FROM order_items WHERE orderId = ?').all(order.id);

            return {
                ...order,
                shipping: JSON.parse(order.shipping),
                payment: JSON.parse(order.payment),
                items
            };
        });

        res.json(orders);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Помилка сервера' });
    }
});

app.put('/api/orders/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const { status } = req.body;

    try {
        const result = db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, id);

        if (result.changes > 0) {
            const updatedOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
            const items = db.prepare('SELECT * FROM order_items WHERE orderId = ?').all(id);

            res.json({
                ...updatedOrder,
                shipping: JSON.parse(updatedOrder.shipping),
                payment: JSON.parse(updatedOrder.payment),
                items
            });
        } else {
            res.status(404).json({ success: false, message: 'Замовлення не знайдено' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Помилка сервера' });
    }
});

app.get('/api/manager/account', (req, res) => {
    try {
        const account = db.prepare('SELECT * FROM manager_account WHERE id = 1').get();
        res.json({ balance: account.balance });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Помилка сервера' });
    }
});

// Головний HTML файл
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`Сервер запущено на порту ${port}`);
});

// Закриття БД при завершенні роботи
process.on('exit', () => {
    db.close();
});