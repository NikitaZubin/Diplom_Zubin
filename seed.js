// seed.js
const Database = require('better-sqlite3');
const db = new Database('bookstore.db');

function seedDatabase() {
    console.log('Початок заповнення бази даних...');

    // Очищення існуючих даних
    db.prepare('DELETE FROM order_items').run();
    db.prepare('DELETE FROM orders').run();
    db.prepare('DELETE FROM books').run();
    db.prepare('DELETE FROM users').run();
    db.prepare('DELETE FROM manager_account').run();

    // Скидання автоінкременту
    db.prepare('DELETE FROM sqlite_sequence WHERE name IN (?, ?, ?, ?, ?)').run(
        'users', 'books', 'orders', 'order_items', 'manager_account'
    );

    // Створення запису балансу менеджера
    db.prepare('INSERT INTO manager_account (balance) VALUES (0)').run();

    // Додавання менеджерів
    const insertUser = db.prepare('INSERT INTO users (email, password, role, name) VALUES (?, ?, ?, ?)');
    insertUser.run('manager1@bookstore.ua', 'manager123', 'manager', 'Максим Коваленко');
    insertUser.run('manager2@bookstore.ua', 'manager456', 'manager', 'Олена Шевченко');

    // Додавання клієнтів
    const clients = [
        { email: 'client1@example.com', name: 'Іван Петренко' },
        { email: 'client2@example.com', name: 'Оксана Мельник' },
        { email: 'client3@example.com', name: 'Андрій Бондаренко' },
        { email: 'client4@example.com', name: 'Наталія Ковальчук' },
        { email: 'client5@example.com', name: 'Сергій Шевчук' }
    ];

    clients.forEach(client => {
        insertUser.run(client.email, 'password123', 'customer', client.name);
    });

    // Зображення книг - використовуємо заглушки з кольорами з дизайну
    const imageUrls = [
        'https://via.placeholder.com/300x450/59253A/FFFFFF?text=Книга',
        'https://via.placeholder.com/300x450/895061/FFFFFF?text=Книга',
        'https://via.placeholder.com/300x450/2D4159/FFFFFF?text=Книга',
        'https://via.placeholder.com/300x450/78244C/FFFFFF?text=Книга',
        'https://via.placeholder.com/300x450/067TA1/FFFFFF?text=Книга'
    ];

    // Заглушки для конкретних категорій
    const categoryImages = {
        'Українська класика': 'https://via.placeholder.com/300x450/59253A/FFFFFF?text=Класика',
        'Сучасна українська література': 'https://via.placeholder.com/300x450/895061/FFFFFF?text=Сучасна',
        'Історія України': 'https://via.placeholder.com/300x450/2D4159/FFFFFF?text=Історія',
        'Дитяча література': 'https://via.placeholder.com/300x450/78244C/FFFFFF?text=Дитяча',
        'Наукова література': 'https://via.placeholder.com/300x450/067TA1/FFFFFF?text=Наукова',
        'Фантастика та фентезі': 'https://via.placeholder.com/300x450/59253A/FFFFFF?text=Фантастика',
        'Бізнес-література': 'https://via.placeholder.com/300x450/895061/FFFFFF?text=Бізнес'
    };

    // Книги
    const booksData = [
        { title: 'Кобзар', author: 'Тарас Шевченко', category: 'Українська класика', price: 320, description: 'Збірка поетичних творів Тараса Шевченка, що є основою української літератури.'},
        { title: 'Лісова пісня', author: 'Леся Українка', category: 'Українська класика', price: 290, description: 'Драма-феєрія про кохання лісовика Лукаша та мавки.' },
        { title: 'Тигролови', author: 'Іван Багряний', category: 'Українська класика', price: 310, description: 'Пригодницький роман про українця Григорія Многогрішного та його боротьбу за свободу.', image: "/image/Voroshilovgrad.jpg" },
        { title: 'Енеїда', author: 'Іван Котляревський', category: 'Українська класика', price: 280, description: 'Бурлескно-травестійна поема, що започаткувала нову українську літературу.' },

        { title: 'Інтернат', author: 'Сергій Жадан', category: 'Сучасна українська література', price: 420, description: 'Роман про події на сході України, війну та її вплив на звичайних людей.' },
        { title: 'Ворошиловград', author: 'Сергій Жадан', category: 'Сучасна українська література', price: 390, description: 'Роман про повернення людини до свого рідного міста та боротьбу за сімейний бізнес.' },
        { title: 'Фелікс Австрія', author: 'Софія Андрухович', category: 'Сучасна українська література', price: 350, description: 'Історична сага про життя галицького міста Станіславова на початку XX століття.' },
        { title: 'Музей покинутих секретів', author: 'Оксана Забужко', category: 'Сучасна українська література', price: 450, description: 'Роман про українську історію 1940-х і події сучасності.' },

        { title: 'Захар Беркут', author: 'Іван Франко', category: 'Історія України', price: 300, description: 'Історична повість про боротьбу карпатських громад проти монголо-татарських завойовників.' },
        { title: 'Чорна Рада', author: 'Пантелеймон Куліш', category: 'Історія України', price: 320, description: 'Перший український історичний роман про події після смерті Богдана Хмельницького.' },
        { title: 'Холодний Яр', author: 'Юрій Горліс-Горський', category: 'Історія України', price: 380, description: 'Документальний роман про повстанський рух у Холодному Яру на початку 1920-х років.' },

        { title: 'Пригоди Тома Сойєра', author: 'Марк Твен (переклад)', category: 'Дитяча література', price: 240, description: 'Захоплива історія про пригоди хлопчика Тома Сойєра.' },
        { title: 'Гаррі Поттер і філософський камінь', author: 'Джоан Роулінг (переклад)', category: 'Дитяча література', price: 410, description: 'Перша книга з серії про юного чарівника Гаррі Поттера.' },
        { title: 'Аліса в Країні Див', author: 'Льюїс Керрол (переклад)', category: 'Дитяча література', price: 270, description: 'Казкова повість про пригоди дівчинки Аліси в чарівній країні.' },

        { title: 'Історія Науки', author: 'Степан Процюк', category: 'Наукова література', price: 360, description: 'Огляд розвитку науки від давніх часів до сучасності.' },
        { title: 'Короткий курс фізики', author: 'Іван Вакарчук', category: 'Наукова література', price: 390, description: 'Підручник з фізики для студентів університетів.' },
        { title: 'Молекулярна біологія', author: 'Наталія Курченко', category: 'Наукова література', price: 420, description: 'Сучасний підручник з молекулярної біології.' },

        { title: 'Відьмак: Останнє бажання', author: 'Анджей Сапковський (переклад)', category: 'Фантастика та фентезі', price: 340, description: 'Перша книга з серії про пригоди відьмака Геральта.' },
        { title: '1984', author: 'Джордж Орвелл (переклад)', category: 'Фантастика та фентезі', price: 310, description: 'Культовий антиутопічний роман про тоталітарне суспільство майбутнього.' },
        { title: 'Дюна', author: 'Френк Герберт (переклад)', category: 'Фантастика та фентезі', price: 380, description: 'Науково-фантастичний роман про міжзоряну імперію майбутнього.' },

        { title: 'Багатий тато, бідний тато', author: 'Роберт Кійосакі (переклад)', category: 'Бізнес-література', price: 300, description: 'Книга про особисті фінанси та інвестиції.' },
        { title: 'Мистецтво війни', author: 'Сунь-Цзи (переклад)', category: 'Бізнес-література', price: 260, description: 'Класичний трактат про військову стратегію, що застосовується в бізнесі.' },
        { title: 'Від нуля до одиниці', author: 'Пітер Тіль (переклад)', category: 'Бізнес-література', price: 350, description: 'Нотатки про стартапи та як будувати майбутнє.' },
        { title: 'Наодинці з океаном', author: 'Слава Курилов', category: 'Бізнес-література', price: 290, description: 'Історія про мотивацію та досягнення цілей.' }
    ];

    // Додавання книг до бази даних
    const insertBook = db.prepare('INSERT INTO books (title, author, category, price, description, image, inStock) VALUES (?, ?, ?, ?, ?, ?, ?)');

    booksData.forEach((book, index) => {
        // Використовуємо спеціальні заглушки для категорій, якщо вони існують
        const bookImage = categoryImages[book.category] ||
            // Інакше використовуємо заглушку з іменем книги
            `https://via.placeholder.com/300x450/59253A/FFFFFF?text=${encodeURIComponent(book.title)}`;

        insertBook.run(
            book.title,
            book.author,
            book.category,
            book.price,
            book.description,
            bookImage,
            Math.floor(Math.random() * 50) + 5 // Випадкова кількість від 5 до 55
        );
    });

    // Створення замовлень
    const orderStatuses = ['Новий', 'Оброблений', 'Відправлений', 'Доставлений', 'Скасований'];

    const insertOrder = db.prepare('INSERT INTO orders (userId, totalAmount, shipping, payment, status, date) VALUES (?, ?, ?, ?, ?, ?)');
    const insertOrderItem = db.prepare('INSERT INTO order_items (orderId, bookId, title, price, quantity) VALUES (?, ?, ?, ?, ?)');

    // Отримання даних про книги для замовлень
    const allBooks = db.prepare('SELECT * FROM books').all();

    for (let i = 0; i < 10; i++) {
        const userId = Math.floor(Math.random() * 5) + 3; // Вибір випадкового клієнта (id 3-7)
        const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);

        // Вибір випадкових книжок для замовлення
        const orderBooksCount = Math.floor(Math.random() * 3) + 1; // 1-3 книги в замовленні
        const orderBooks = [];

        for (let j = 0; j < orderBooksCount; j++) {
            const randomBookIndex = Math.floor(Math.random() * allBooks.length);
            const book = allBooks[randomBookIndex];
            const quantity = Math.floor(Math.random() * 3) + 1; // 1-3 екземпляри

            orderBooks.push({
                bookId: book.id,
                title: book.title,
                price: book.price,
                quantity: quantity
            });
        }

        const totalAmount = orderBooks.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const status = orderStatuses[Math.floor(Math.random() * orderStatuses.length)];
        const date = new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)).toISOString();

        const shipping = JSON.stringify({
            fullName: user.name,
            address: 'вул. Шевченка, 25/12',
            city: 'Київ',
            postalCode: '01001',
            phone: '+380501234567'
        });

        const payment = JSON.stringify({
            method: 'card',
            lastFour: '1234'
        });

        const orderResult = insertOrder.run(userId, totalAmount, shipping, payment, status, date);
        const orderId = orderResult.lastInsertRowid;

        orderBooks.forEach(item => {
            insertOrderItem.run(orderId, item.bookId, item.title, item.price, item.quantity);
        });

        // Оновлення балансу менеджера
        if (status !== 'Скасований') {
            db.prepare('UPDATE manager_account SET balance = balance + ? WHERE id = 1').run(totalAmount);
        }
    }

    console.log('База даних успішно заповнена:');
    console.log('- 2 менеджери');
    console.log('- 5 клієнтів');
    console.log('- 25 книг з картинками-заглушками');
    console.log('- 10 замовлень');
}

// Перевірка, чи всі необхідні таблиці існують
function checkAndCreateTables() {
    const tables = db.prepare(`
    SELECT name FROM sqlite_master
    WHERE type='table'
    AND name IN ('users', 'books', 'orders', 'order_items', 'manager_account')
  `).all();

    if (tables.length < 5) {
        console.log('Створення таблиць...');

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

        console.log('Таблиці успішно створені.');
    }
}

try {
    checkAndCreateTables();
    seedDatabase();
    console.log('Процес заповнення бази даних завершено успішно.');
} catch (error) {
    console.error('Помилка при заповненні бази даних:', error);
}