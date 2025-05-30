// Використання React
const React = window.React;
const ReactDOM = window.ReactDOM;

// Головний компонент додатку
const App = () => {
    const [user, setUser] = React.useState(null);
    const [page, setPage] = React.useState('home');
    const [books, setBooks] = React.useState([]);
    const [categories, setCategories] = React.useState([]);
    const [cart, setCart] = React.useState([]);
    const [favorites, setFavorites] = React.useState([]);
    const [viewedItems, setViewedItems] = React.useState([]);
    const [searchQuery, setSearchQuery] = React.useState('');
    const [searchResults, setSearchResults] = React.useState([]);
    const [selectedBook, setSelectedBook] = React.useState(null);
    const [orders, setOrders] = React.useState([]);
    const [managerAccount, setManagerAccount] = React.useState({ balance: 0 });
    const [notification, setNotification] = React.useState(null);

    // Завантаження даних
    React.useEffect(() => {
        if (user && user.role === 'manager') {
            fetchOrders();
            fetchManagerAccount();
        }
        fetchBooks();
    }, [user]);

    React.useEffect(() => {
        if (books.length > 0) {
            const uniqueCategories = [...new Set(books.map(book => book.category))];
            setCategories(uniqueCategories);
        }
    }, [books]);

    // Збереження даних у LocalStorage
    React.useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }

        const storedCart = localStorage.getItem('cart');
        if (storedCart) {
            setCart(JSON.parse(storedCart));
        }

        const storedFavorites = localStorage.getItem('favorites');
        if (storedFavorites) {
            setFavorites(JSON.parse(storedFavorites));
        }

        const storedViewedItems = localStorage.getItem('viewedItems');
        if (storedViewedItems) {
            setViewedItems(JSON.parse(storedViewedItems));
        }
    }, []);

    React.useEffect(() => {
        if (user) {
            localStorage.setItem('user', JSON.stringify(user));
        }
    }, [user]);

    React.useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cart));
    }, [cart]);

    React.useEffect(() => {
        localStorage.setItem('favorites', JSON.stringify(favorites));
    }, [favorites]);

    React.useEffect(() => {
        localStorage.setItem('viewedItems', JSON.stringify(viewedItems));
    }, [viewedItems]);

    // Функції API
    const fetchBooks = async () => {
        try {
            const response = await fetch('/api/books');
            const data = await response.json();
            setBooks(data);
        } catch (error) {
            showNotification('Помилка завантаження книг', 'error');
        }
    };

    const fetchOrders = async () => {
        try {
            const response = await fetch(`/api/orders?role=${user.role}`);
            const data = await response.json();
            setOrders(data);
        } catch (error) {
            showNotification('Помилка завантаження замовлень', 'error');
        }
    };

    const fetchManagerAccount = async () => {
        try {
            const response = await fetch('/api/manager/account');
            const data = await response.json();
            setManagerAccount(data);
        } catch (error) {
            showNotification('Помилка завантаження даних рахунку', 'error');
        }
    };

    const login = async (email, password) => {
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (data.success) {
                setUser(data.user);
                setPage('home');
                showNotification('Ласкаво просимо!', 'success');
            } else {
                showNotification(data.message, 'error');
            }
        } catch (error) {
            showNotification('Помилка входу', 'error');
        }
    };

    const register = async (email, password, name, role = 'customer') => {
        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, name, role })
            });

            const data = await response.json();

            if (data.success) {
                setUser(data.user);
                setPage('home');
                showNotification('Реєстрація успішна!', 'success');
            } else {
                showNotification(data.message, 'error');
            }
        } catch (error) {
            showNotification('Помилка реєстрації', 'error');
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
        setPage('home');
        showNotification('Ви вийшли з системи', 'info');
    };

    const addToCart = (book) => {
        const existingItem = cart.find(item => item.id === book.id);

        if (existingItem) {
            setCart(cart.map(item =>
                item.id === book.id
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
            ));
        } else {
            setCart([...cart, { ...book, quantity: 1 }]);
        }

        showNotification('Додано до кошика', 'success');
    };

    const removeFromCart = (bookId) => {
        setCart(cart.filter(item => item.id !== bookId));
        showNotification('Видалено з кошика', 'info');
    };

    const updateCartItemQuantity = (bookId, quantity) => {
        if (quantity < 1) {
            removeFromCart(bookId);
            return;
        }

        setCart(cart.map(item =>
            item.id === bookId
                ? { ...item, quantity }
                : item
        ));
    };

    const toggleFavorite = (book) => {
        const isFavorite = favorites.some(item => item.id === book.id);

        if (isFavorite) {
            setFavorites(favorites.filter(item => item.id !== book.id));
            showNotification('Видалено з обраного', 'info');
        } else {
            setFavorites([...favorites, book]);
            showNotification('Додано до обраного', 'success');
        }
    };

    const viewBook = (book) => {
        setSelectedBook(book);
        setPage('bookDetails');

        // Додавання до переглянутих книг
        if (!viewedItems.some(item => item.id === book.id)) {
            // Зберігаємо тільки останні 8 переглянутих книг
            const updatedViewedItems = [book, ...viewedItems].slice(0, 8);
            setViewedItems(updatedViewedItems);
        }
    };

    const searchBooks = (query) => {
        setSearchQuery(query);

        if (query.trim() === '') {
            setSearchResults([]);
            return;
        }

        const results = books.filter(book =>
            book.title.toLowerCase().includes(query.toLowerCase()) ||
            book.author.toLowerCase().includes(query.toLowerCase())
        );

        setSearchResults(results);
    };

    const createOrder = async (orderData) => {
        try {
            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
            });

            const data = await response.json();

            if (data.success) {
                setCart([]);
                localStorage.removeItem('cart');
                setPage('orderConfirmation');
                showNotification('Замовлення оформлено!', 'success');
                return data.order;
            } else {
                showNotification(data.message, 'error');
                return null;
            }
        } catch (error) {
            showNotification('Помилка оформлення замовлення', 'error');
            return null;
        }
    };

    const updateOrderStatus = async (orderId, status) => {
        try {
            const response = await fetch(`/api/orders/${orderId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });

            const data = await response.json();

            if (response.ok) {
                fetchOrders();
                showNotification('Статус замовлення оновлено', 'success');
            } else {
                showNotification(data.message, 'error');
            }
        } catch (error) {
            showNotification('Помилка оновлення статусу', 'error');
        }
    };

    const addBook = async (bookData) => {
        try {
            const response = await fetch('/api/books', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bookData)
            });

            const data = await response.json();

            if (response.ok) {
                fetchBooks();
                showNotification('Книгу додано', 'success');
                return true;
            } else {
                showNotification(data.message, 'error');
                return false;
            }
        } catch (error) {
            showNotification('Помилка додавання книги', 'error');
            return false;
        }
    };

    const updateBook = async (id, bookData) => {
        try {
            const response = await fetch(`/api/books/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bookData)
            });

            const data = await response.json();

            if (response.ok) {
                fetchBooks();
                showNotification('Книгу оновлено', 'success');
                return true;
            } else {
                showNotification(data.message, 'error');
                return false;
            }
        } catch (error) {
            showNotification('Помилка оновлення книги', 'error');
            return false;
        }
    };

    const deleteBook = async (id) => {
        try {
            const response = await fetch(`/api/books/${id}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (response.ok) {
                fetchBooks();
                showNotification('Книгу видалено', 'success');
                return true;
            } else {
                showNotification(data.message, 'error');
                return false;
            }
        } catch (error) {
            showNotification('Помилка видалення книги', 'error');
            return false;
        }
    };

    const showNotification = (message, type) => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    // Відображення компонентів
    const renderContent = () => {
        switch (page) {
            case 'home':
                return <HomePage
                    books={books}
                    categories={categories}
                    viewBook={viewBook}
                    addToCart={addToCart}
                    toggleFavorite={toggleFavorite}
                    favorites={favorites}
                    viewedItems={viewedItems}
                />;
            case 'login':
                return <LoginPage login={login} setPage={setPage} />;
            case 'register':
                return <RegisterPage register={register} setPage={setPage} />;
            case 'bookDetails':
                return <BookDetailsPage
                    book={selectedBook}
                    addToCart={addToCart}
                    toggleFavorite={toggleFavorite}
                    isFavorite={favorites.some((item) => item.id === (selectedBook && selectedBook.id))}
                    relatedBooks={books.filter((book) => (selectedBook && book.category === selectedBook.category && book.id !== selectedBook.id)).slice(0, 4)}
                    viewBook={viewBook}
                />;
            case 'cart':
                return <CartPage
                    cart={cart}
                    removeFromCart={removeFromCart}
                    updateCartItemQuantity={updateCartItemQuantity}
                    setPage={setPage}
                    user={user}
                />;
            case 'checkout':
                return <CheckoutPage
                    cart={cart}
                    createOrder={createOrder}
                    user={user}
                />;
            case 'orderConfirmation':
                return <OrderConfirmationPage setPage={setPage} />;
            case 'favorites':
                return <FavoritesPage
                    favorites={favorites}
                    viewBook={viewBook}
                    addToCart={addToCart}
                    toggleFavorite={toggleFavorite}
                />;
            case 'search':
                return <SearchPage
                    results={searchResults}
                    query={searchQuery}
                    viewBook={viewBook}
                    addToCart={addToCart}
                    toggleFavorite={toggleFavorite}
                    favorites={favorites}
                />;
            case 'manageBooks':
                return <ManageBooksPage
                    books={books}
                    addBook={addBook}
                    updateBook={updateBook}
                    deleteBook={deleteBook}
                />;
            case 'manageOrders':
                return <ManageOrdersPage
                    orders={orders}
                    updateOrderStatus={updateOrderStatus}
                />;
            case 'account':
                return <AccountPage
                    user={user}
                    logout={logout}
                    managerAccount={managerAccount}
                />;
            default:
                return <HomePage
                    books={books}
                    categories={categories}
                    viewBook={viewBook}
                    addToCart={addToCart}
                    toggleFavorite={toggleFavorite}
                    favorites={favorites}
                    viewedItems={viewedItems}
                />;
        }
    };

    return (
        <div className="app">
            <Header
                user={user}
                setPage={setPage}
                cartItemsCount={cart.reduce((total, item) => total + item.quantity, 0)}
                searchBooks={searchBooks}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
            />

            <main className="main-content">
                {renderContent()}
            </main>

            <Footer />

            {notification && (
                <div className={`notification ${notification.type}`}>
                    {notification.message}
                </div>
            )}
        </div>
    );
};

// Компонент заголовка
const Header = ({ user, setPage, cartItemsCount, searchBooks, searchQuery, setSearchQuery }) => {
    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            searchBooks(searchQuery);
            setPage('search');
        }
    };

    return (
        <header className="header">
            <div className="logo" onClick={() => setPage('home')}>
                <h1>Книжковий Онлайн</h1>
            </div>

            <form className="search-form" onSubmit={handleSearchSubmit}>
                <input
                    type="text"
                    placeholder="Пошук книг..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button type="submit">Пошук</button>
            </form>

            <nav className="navigation">
                <ul>
                    <li onClick={() => setPage('home')}>Головна</li>
                    <li onClick={() => setPage('favorites')}>Обране</li>
                    <li onClick={() => setPage('cart')}>Кошик {cartItemsCount > 0 && <span className="badge">{cartItemsCount}</span>}</li>

                    {user ? (
                        <React.Fragment>
                            <li onClick={() => setPage('account')}>{user.name || user.email}</li>
                            {user.role === 'manager' && (
                                <React.Fragment>
                                    <li onClick={() => setPage('manageBooks')}>Керування книгами</li>
                                    <li onClick={() => setPage('manageOrders')}>Замовлення</li>
                                </React.Fragment>
                            )}
                        </React.Fragment>
                    ) : (
                        <React.Fragment>
                            <li onClick={() => setPage('login')}>Вхід</li>
                            <li onClick={() => setPage('register')}>Реєстрація</li>
                        </React.Fragment>
                    )}
                </ul>
            </nav>
        </header>
    );
};

// Компонент футера
const Footer = () => {
    return (
        <footer className="footer">
            <div className="footer-content">
                <div className="footer-section">
                    <h3>Книжковий Онлайн</h3>
                    <p>Найкращий магазин книг в Україні</p>
                </div>

                <div className="footer-section">
                    <h3>Контакти</h3>
                    <p>Email: info@bookstore.ua</p>
                    <p>Телефон: +38 (044) 123-45-67</p>
                </div>

                <div className="footer-section">
                    <h3>Слідкуйте за нами</h3>
                    <div className="social-links">
                        <a href="#" className="social-link">Facebook</a>
                        <a href="#" className="social-link">Instagram</a>
                        <a href="#" className="social-link">Twitter</a>
                    </div>
                </div>
            </div>

            <div className="copyright">
                © {new Date().getFullYear()} Книжковий Онлайн. Усі права захищено.
            </div>
        </footer>
    );
};

// Головна сторінка
const HomePage = ({ books, categories, viewBook, addToCart, toggleFavorite, favorites, viewedItems }) => {
    const [activeCategory, setActiveCategory] = React.useState('all');

    const filteredBooks = activeCategory === 'all'
        ? books
        : books.filter(book => book.category === activeCategory);

    return (
        <div className="home-page">
            <div className="categories">
                <h2>Категорії</h2>
                <ul>
                    <li
                        className={activeCategory === 'all' ? 'active' : ''}
                        onClick={() => setActiveCategory('all')}
                    >
                        Усі книги
                    </li>
                    {categories.map(category => (
                        <li
                            key={category}
                            className={activeCategory === category ? 'active' : ''}
                            onClick={() => setActiveCategory(category)}
                        >
                            {category}
                        </li>
                    ))}
                </ul>
            </div>

            <div className="books-container">
                <h2>{activeCategory === 'all' ? 'Усі книги' : activeCategory}</h2>

                {filteredBooks.length === 0 ? (
                    <p>Немає книг у цій категорії</p>
                ) : (
                    <div className="books-grid">
                        {filteredBooks.map(book => (
                            <BookCard
                                key={book.id}
                                book={book}
                                viewBook={viewBook}
                                addToCart={addToCart}
                                toggleFavorite={toggleFavorite}
                                isFavorite={favorites.some(item => item.id === book.id)}
                            />
                        ))}
                    </div>
                )}

                {viewedItems.length > 0 && (
                    <div className="viewed-items">
                        <h2>Переглянуті книги</h2>
                        <div className="books-grid">
                            {viewedItems.map(book => (
                                <BookCard
                                    key={book.id}
                                    book={book}
                                    viewBook={viewBook}
                                    addToCart={addToCart}
                                    toggleFavorite={toggleFavorite}
                                    isFavorite={favorites.some(item => item.id === book.id)}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// Картка книги
const BookCard = ({ book, viewBook, addToCart, toggleFavorite, isFavorite }) => {
    return (
        <div className="book-card">
            <div className="book-image" onClick={() => viewBook(book)}>
                <img src={book.image || 'https://via.placeholder.com/150?text=НемаєФото'} alt={book.title} />
            </div>

            <div className="book-info">
                <h3 onClick={() => viewBook(book)}>{book.title}</h3>
                <p className="author">{book.author}</p>
                <p className="price">{book.price} грн</p>
            </div>

            <div className="book-actions">
                <button className="btn-add-to-cart" onClick={() => addToCart(book)}>
                    Додати до кошика
                </button>
                <button
                    className={`btn-favorite ${isFavorite ? 'active' : ''}`}
                    onClick={() => toggleFavorite(book)}
                >
                    {isFavorite ? '★' : '☆'}
                </button>
            </div>
        </div>
    );
};

// Сторінка деталей книги
const BookDetailsPage = ({ book, addToCart, toggleFavorite, isFavorite, relatedBooks, viewBook }) => {
    if (!book) return <div>Книгу не знайдено</div>;

    return (
        <div className="book-details-page">
            <div className="book-details">
                <div className="book-image">
                    <img src={book.image || 'https://via.placeholder.com/300?text=НемаєФото'} alt={book.title} />
                </div>

                <div className="book-info">
                    <h1>{book.title}</h1>
                    <p className="author">Автор: {book.author}</p>
                    <p className="category">Категорія: {book.category}</p>
                    <p className="price">Ціна: {book.price} грн</p>
                    <p className="stock">В наявності: {book.inStock} шт.</p>

                    <div className="description">
                        <h3>Опис:</h3>
                        <p>{book.description}</p>
                    </div>

                    <div className="book-actions">
                        <button className="btn-add-to-cart" onClick={() => addToCart(book)}>
                            Додати до кошика
                        </button>
                        <button
                            className={`btn-favorite ${isFavorite ? 'active' : ''}`}
                            onClick={() => toggleFavorite(book)}
                        >
                            {isFavorite ? 'Видалити з обраного' : 'Додати до обраного'}
                        </button>
                    </div>
                </div>
            </div>

            {relatedBooks.length > 0 && (
                <div className="related-books">
                    <h2>Схожі книги</h2>
                    <div className="books-grid">
                        {relatedBooks.map(book => (
                            <BookCard
                                key={book.id}
                                book={book}
                                viewBook={viewBook}
                                addToCart={addToCart}
                                toggleFavorite={toggleFavorite}
                                isFavorite={isFavorite}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// Сторінка входу
const LoginPage = ({ login, setPage }) => {
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [errors, setErrors] = React.useState({});

    const validateForm = () => {
        const newErrors = {};

        if (!email.trim()) {
            newErrors.email = 'Введіть ваш email';
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = 'Введіть коректний email';
        }

        if (!password) {
            newErrors.password = 'Введіть ваш пароль';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (validateForm()) {
            login(email, password);
        }
    };

    return (
        <div className="auth-page">
            <h2>Вхід в систему</h2>

            <form className="auth-form" onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={errors.email ? 'error' : ''}
                    />
                    {errors.email && <span className="error-message">{errors.email}</span>}
                </div>

                <div className="form-group">
                    <label htmlFor="password">Пароль</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={errors.password ? 'error' : ''}
                    />
                    {errors.password && <span className="error-message">{errors.password}</span>}
                </div>

                <button type="submit" className="btn-submit">Увійти</button>
            </form>

            <p className="auth-link">
                Ще не зареєстровані? <span onClick={() => setPage('register')}>Реєстрація</span>
            </p>
        </div>
    );
};

// Сторінка реєстрації
const RegisterPage = ({ register, setPage }) => {
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [confirmPassword, setConfirmPassword] = React.useState('');
    const [name, setName] = React.useState('');
    const [role, setRole] = React.useState('customer');
    const [errors, setErrors] = React.useState({});

    const validateForm = () => {
        const newErrors = {};

        if (!name.trim()) {
            newErrors.name = 'Введіть ваше ім\'я';
        }

        if (!email.trim()) {
            newErrors.email = 'Введіть ваш email';
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = 'Введіть коректний email';
        }

        if (!password) {
            newErrors.password = 'Введіть пароль';
        } else if (password.length < 6) {
            newErrors.password = 'Пароль повинен містити не менше 6 символів';
        }

        if (password !== confirmPassword) {
            newErrors.confirmPassword = 'Паролі не співпадають';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (validateForm()) {
            register(email, password, name, role);
        }
    };

    return (
        <div className="auth-page">
            <h2>Реєстрація</h2>

            <form className="auth-form" onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="name">Ім'я</label>
                    <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className={errors.name ? 'error' : ''}
                    />
                    {errors.name && <span className="error-message">{errors.name}</span>}
                </div>

                <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={errors.email ? 'error' : ''}
                    />
                    {errors.email && <span className="error-message">{errors.email}</span>}
                </div>

                <div className="form-group">
                    <label htmlFor="password">Пароль</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={errors.password ? 'error' : ''}
                    />
                    {errors.password && <span className="error-message">{errors.password}</span>}
                </div>

                <div className="form-group">
                    <label htmlFor="confirmPassword">Підтвердження паролю</label>
                    <input
                        type="password"
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={errors.confirmPassword ? 'error' : ''}
                    />
                    {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
                </div>

                <div className="form-group">
                    <label htmlFor="role">Роль</label>
                    <select
                        id="role"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                    >
                        <option value="customer">Покупець</option>
                        <option value="manager">Менеджер</option>
                    </select>
                </div>

                <button type="submit" className="btn-submit">Зареєструватися</button>
            </form>

            <p className="auth-link">
                Вже зареєстровані? <span onClick={() => setPage('login')}>Увійти</span>
            </p>
        </div>
    );
};

// Сторінка кошика
const CartPage = ({ cart, removeFromCart, updateCartItemQuantity, setPage, user }) => {
    const totalAmount = cart.reduce((total, item) => total + item.price * item.quantity, 0);

    if (cart.length === 0) {
        return (
            <div className="empty-cart">
                <h2>Ваш кошик порожній</h2>
                <p>Додайте книги до кошика, щоб зробити замовлення</p>
                <button className="btn-primary" onClick={() => setPage('home')}>
                    Повернутися до магазину
                </button>
            </div>
        );
    }

    return (
        <div className="cart-page">
            <h2>Кошик</h2>

            <div className="cart-items">
                {cart.map(item => (
                    <div className="cart-item" key={item.id}>
                        <div className="item-image">
                            <img src={item.image || 'https://via.placeholder.com/100?text=НемаєФото'} alt={item.title} />
                        </div>

                        <div className="item-details">
                            <h3>{item.title}</h3>
                            <p className="author">{item.author}</p>
                            <p className="price">{item.price} грн</p>
                        </div>

                        <div className="item-quantity">
                            <button
                                onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                            >
                                -
                            </button>
                            <span>{item.quantity}</span>
                            <button
                                onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                                disabled={item.quantity >= item.inStock}
                            >
                                +
                            </button>
                        </div>

                        <div className="item-total">
                            {item.price * item.quantity} грн
                        </div>

                        <button className="btn-remove" onClick={() => removeFromCart(item.id)}>
                            Видалити
                        </button>
                    </div>
                ))}
            </div>

            <div className="cart-summary">
                <div className="total-amount">
                    <span>Загальна сума:</span>
                    <span>{totalAmount} грн</span>
                </div>

                <div className="cart-actions">
                    <button className="btn-continue-shopping" onClick={() => setPage('home')}>
                        Продовжити покупки
                    </button>
                    <button
                        className="btn-checkout"
                        onClick={() => setPage(user ? 'checkout' : 'login')}
                    >
                        {user ? 'Оформити замовлення' : 'Увійти для оформлення'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Сторінка оформлення замовлення
const CheckoutPage = ({ cart, createOrder, user }) => {
    const [shippingDetails, setShippingDetails] = React.useState({
        fullName: (user && user.name) || '',
        address: '',
        city: '',
        postalCode: '',
        phone: ''
    });

    const [paymentDetails, setPaymentDetails] = React.useState({
        cardNumber: '',
        cardHolder: '',
        expiryDate: '',
        cvv: ''
    });

    const [errors, setErrors] = React.useState({});

    const totalAmount = cart.reduce((total, item) => total + item.price * item.quantity, 0);

    const validateForm = () => {
        const newErrors = {};

        // Перевірка даних доставки
        if (!shippingDetails.fullName.trim()) {
            newErrors.fullName = 'Введіть ваше ім\'я';
        }

        if (!shippingDetails.address.trim()) {
            newErrors.address = 'Введіть адресу доставки';
        }

        if (!shippingDetails.city.trim()) {
            newErrors.city = 'Введіть місто';
        }

        if (!shippingDetails.postalCode.trim()) {
            newErrors.postalCode = 'Введіть поштовий індекс';
        }

        if (!shippingDetails.phone.trim()) {
            newErrors.phone = 'Введіть номер телефону';
        } else if (!/^\+?\d{10,12}$/.test(shippingDetails.phone.replace(/\s/g, ''))) {
            newErrors.phone = 'Введіть коректний номер телефону';
        }

        // Перевірка платіжних даних
        if (!paymentDetails.cardNumber.trim()) {
            newErrors.cardNumber = 'Введіть номер картки';
        } else if (!/^\d{16}$/.test(paymentDetails.cardNumber.replace(/\s/g, ''))) {
            newErrors.cardNumber = 'Номер картки повинен містити 16 цифр';
        }

        if (!paymentDetails.cardHolder.trim()) {
            newErrors.cardHolder = 'Введіть ім\'я власника картки';
        }

        if (!paymentDetails.expiryDate.trim()) {
            newErrors.expiryDate = 'Введіть термін дії картки';
        } else if (!/^\d{2}\/\d{2}$/.test(paymentDetails.expiryDate)) {
            newErrors.expiryDate = 'Використовуйте формат ММ/РР';
        }

        if (!paymentDetails.cvv.trim()) {
            newErrors.cvv = 'Введіть CVV код';
        } else if (!/^\d{3}$/.test(paymentDetails.cvv)) {
            newErrors.cvv = 'CVV код повинен містити 3 цифри';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleShippingChange = (e) => {
        const { name, value } = e.target;
        setShippingDetails({ ...shippingDetails, [name]: value });
    };

    const handlePaymentChange = (e) => {
        const { name, value } = e.target;
        setPaymentDetails({ ...paymentDetails, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (validateForm()) {
            const orderData = {
                userId: user.id,
                items: cart.map(item => ({
                    id: item.id,
                    title: item.title,
                    price: item.price,
                    quantity: item.quantity
                })),
                totalAmount,
                shipping: shippingDetails,
                payment: {
                    method: 'card',
                    lastFour: paymentDetails.cardNumber.slice(-4)
                },
            };

            const order = await createOrder(orderData);
        }
    };

    return (
        <div className="checkout-page">
            <h2>Оформлення замовлення</h2>

            <div className="checkout-container">
                <div className="checkout-form">
                    <form onSubmit={handleSubmit}>
                        <div className="form-section">
                            <h3>Дані доставки</h3>

                            <div className="form-group">
                                <label htmlFor="fullName">Повне ім'я</label>
                                <input
                                    type="text"
                                    id="fullName"
                                    name="fullName"
                                    value={shippingDetails.fullName}
                                    onChange={handleShippingChange}
                                    className={errors.fullName ? 'error' : ''}
                                />
                                {errors.fullName && <span className="error-message">{errors.fullName}</span>}
                            </div>

                            <div className="form-group">
                                <label htmlFor="address">Адреса</label>
                                <input
                                    type="text"
                                    id="address"
                                    name="address"
                                    value={shippingDetails.address}
                                    onChange={handleShippingChange}
                                    className={errors.address ? 'error' : ''}
                                />
                                {errors.address && <span className="error-message">{errors.address}</span>}
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="city">Місто</label>
                                    <input
                                        type="text"
                                        id="city"
                                        name="city"
                                        value={shippingDetails.city}
                                        onChange={handleShippingChange}
                                        className={errors.city ? 'error' : ''}
                                    />
                                    {errors.city && <span className="error-message">{errors.city}</span>}
                                </div>

                                <div className="form-group">
                                    <label htmlFor="postalCode">Поштовий індекс</label>
                                    <input
                                        type="text"
                                        id="postalCode"
                                        name="postalCode"
                                        value={shippingDetails.postalCode}
                                        onChange={handleShippingChange}
                                        className={errors.postalCode ? 'error' : ''}
                                    />
                                    {errors.postalCode && <span className="error-message">{errors.postalCode}</span>}
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="phone">Телефон</label>
                                <input
                                    type="text"
                                    id="phone"
                                    name="phone"
                                    value={shippingDetails.phone}
                                    onChange={handleShippingChange}
                                    className={errors.phone ? 'error' : ''}
                                />
                                {errors.phone && <span className="error-message">{errors.phone}</span>}
                            </div>
                        </div>

                        <div className="form-section">
                            <h3>Дані оплати</h3>

                            <div className="form-group">
                                <label htmlFor="cardNumber">Номер картки</label>
                                <input
                                    type="text"
                                    id="cardNumber"
                                    name="cardNumber"
                                    placeholder="1234 5678 9012 3456"
                                    value={paymentDetails.cardNumber}
                                    onChange={handlePaymentChange}
                                    className={errors.cardNumber ? 'error' : ''}
                                />
                                {errors.cardNumber && <span className="error-message">{errors.cardNumber}</span>}
                            </div>

                            <div className="form-group">
                                <label htmlFor="cardHolder">Власник картки</label>
                                <input
                                    type="text"
                                    id="cardHolder"
                                    name="cardHolder"
                                    placeholder="IVAN IVANENKO"
                                    value={paymentDetails.cardHolder}
                                    onChange={handlePaymentChange}
                                    className={errors.cardHolder ? 'error' : ''}
                                />
                                {errors.cardHolder && <span className="error-message">{errors.cardHolder}</span>}
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="expiryDate">Термін дії</label>
                                    <input
                                        type="text"
                                        id="expiryDate"
                                        name="expiryDate"
                                        placeholder="MM/РР"
                                        value={paymentDetails.expiryDate}
                                        onChange={handlePaymentChange}
                                        className={errors.expiryDate ? 'error' : ''}
                                    />
                                    {errors.expiryDate && <span className="error-message">{errors.expiryDate}</span>}
                                </div>

                                <div className="form-group">
                                    <label htmlFor="cvv">CVV</label>
                                    <input
                                        type="text"
                                        id="cvv"
                                        name="cvv"
                                        placeholder="123"
                                        value={paymentDetails.cvv}
                                        onChange={handlePaymentChange}
                                        className={errors.cvv ? 'error' : ''}
                                    />
                                    {errors.cvv && <span className="error-message">{errors.cvv}</span>}
                                </div>
                            </div>
                        </div>

                        <button type="submit" className="btn-submit">
                            Підтвердити замовлення
                        </button>
                    </form>
                </div>

                <div className="order-summary">
                    <h3>Ваше замовлення</h3>

                    <div className="order-items">
                        {cart.map(item => (
                            <div className="order-item" key={item.id}>
                                <span>{item.title} x {item.quantity}</span>
                                <span>{item.price * item.quantity} грн</span>
                            </div>
                        ))}
                    </div>

                    <div className="order-total">
                        <span>Загалом:</span>
                        <span>{totalAmount} грн</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Сторінка підтвердження замовлення
const OrderConfirmationPage = ({ setPage }) => {
    return (
        <div className="order-confirmation">
            <div className="confirmation-message">
                <h2>Замовлення успішно оформлено!</h2>
                <p>Дякуємо за ваше замовлення. Ми надіслали деталі замовлення на вашу електронну пошту.</p>
                <p>Наш менеджер зв'яжеться з вами найближчим часом для підтвердження замовлення.</p>
            </div>

            <button className="btn-primary" onClick={() => setPage('home')}>
                Повернутися до магазину
            </button>
        </div>
    );
};

// Сторінка обраного
const FavoritesPage = ({ favorites, viewBook, addToCart, toggleFavorite }) => {
    if (favorites.length === 0) {
        return (
            <div className="empty-favorites">
                <h2>Обране порожнє</h2>
                <p>Додайте книги до обраного</p>
                <button className="btn-primary" onClick={() => setPage('home')}>
                    Повернутися до магазину
                </button>
            </div>
        );
    }

    return (
        <div className="favorites-page">
            <h2>Обране</h2>

            <div className="books-grid">
                {favorites.map(book => (
                    <BookCard
                        key={book.id}
                        book={book}
                        viewBook={viewBook}
                        addToCart={addToCart}
                        toggleFavorite={toggleFavorite}
                        isFavorite={true}
                    />
                ))}
            </div>
        </div>
    );
};

// Сторінка результатів пошуку
const SearchPage = ({ results, query, viewBook, addToCart, toggleFavorite, favorites }) => {
    if (results.length === 0) {
        return (
            <div className="empty-search">
                <h2>Результатів не знайдено</h2>
                <p>Ми не знайшли книг за запитом "{query}"</p>
                <button className="btn-primary" onClick={() => setPage('home')}>
                    Повернутися до магазину
                </button>
            </div>
        );
    }

    return (
        <div className="search-page">
            <h2>Результати пошуку для "{query}"</h2>

            <div className="books-grid">
                {results.map(book => (
                    <BookCard
                        key={book.id}
                        book={book}
                        viewBook={viewBook}
                        addToCart={addToCart}
                        toggleFavorite={toggleFavorite}
                        isFavorite={favorites.some(item => item.id === book.id)}
                    />
                ))}
            </div>
        </div>
    );
};

// Сторінка керування книгами (для менеджера)
const ManageBooksPage = ({ books, addBook, updateBook, deleteBook }) => {
    const [isAddingBook, setIsAddingBook] = React.useState(false);
    const [isEditingBook, setIsEditingBook] = React.useState(null);
    const [bookForm, setBookForm] = React.useState({
        title: '',
        author: '',
        category: '',
        price: '',
        description: '',
        image: '',
        inStock: ''
    });

    const resetForm = () => {
        setBookForm({
            title: '',
            author: '',
            category: '',
            price: '',
            description: '',
            image: '',
            inStock: ''
        });
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setBookForm({
            ...bookForm,
            [name]: name === 'price' || name === 'inStock' ? parseFloat(value) || '' : value
        });
    };

    const handleAddBook = async (e) => {
        e.preventDefault();

        const success = await addBook(bookForm);

        if (success) {
            resetForm();
            setIsAddingBook(false);
        }
    };

    const handleEditBook = (book) => {
        setIsEditingBook(book.id);
        setBookForm({
            title: book.title,
            author: book.author,
            category: book.category,
            price: book.price,
            description: book.description,
            image: book.image,
            inStock: book.inStock
        });
    };

    const handleUpdateBook = async (e) => {
        e.preventDefault();

        const success = await updateBook(isEditingBook, bookForm);

        if (success) {
            resetForm();
            setIsEditingBook(null);
        }
    };

    const handleDeleteBook = async (id) => {
        if (window.confirm('Ви впевнені, що бажаєте видалити цю книгу?')) {
            await deleteBook(id);
        }
    };

    return (
        <div className="manage-books-page">
            <h2>Керування книгами</h2>

            {!isAddingBook && !isEditingBook && (
                <button className="btn-add" onClick={() => setIsAddingBook(true)}>
                    Додати нову книгу
                </button>
            )}

            {(isAddingBook || isEditingBook) && (
                <div className="book-form-container">
                    <h3>{isEditingBook ? 'Редагувати книгу' : 'Додати нову книгу'}</h3>

                    <form className="book-form" onSubmit={isEditingBook ? handleUpdateBook : handleAddBook}>
                        <div className="form-group">
                            <label htmlFor="title">Назва</label>
                            <input
                                type="text"
                                id="title"
                                name="title"
                                value={bookForm.title}
                                onChange={handleFormChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="author">Автор</label>
                            <input
                                type="text"
                                id="author"
                                name="author"
                                value={bookForm.author}
                                onChange={handleFormChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="category">Категорія</label>
                            <input
                                type="text"
                                id="category"
                                name="category"
                                value={bookForm.category}
                                onChange={handleFormChange}
                                required
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="price">Ціна (грн)</label>
                                <input
                                    type="number"
                                    id="price"
                                    name="price"
                                    value={bookForm.price}
                                    onChange={handleFormChange}
                                    min="0"
                                    step="0.01"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="inStock">Кількість на складі</label>
                                <input
                                    type="number"
                                    id="inStock"
                                    name="inStock"
                                    value={bookForm.inStock}
                                    onChange={handleFormChange}
                                    min="0"
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="description">Опис</label>
                            <textarea
                                id="description"
                                name="description"
                                value={bookForm.description}
                                onChange={handleFormChange}
                                rows="4"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="image">URL зображення</label>
                            <input
                                type="text"
                                id="image"
                                name="image"
                                value={bookForm.image}
                                onChange={handleFormChange}
                            />
                        </div>

                        <div className="form-actions">
                            <button
                                type="button"
                                className="btn-cancel"
                                onClick={() => {
                                    resetForm();
                                    setIsAddingBook(false);
                                    setIsEditingBook(null);
                                }}
                            >
                                Скасувати
                            </button>
                            <button type="submit" className="btn-submit">
                                {isEditingBook ? 'Оновити' : 'Додати'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {!isAddingBook && !isEditingBook && (
                <div className="books-table-container">
                    <table className="books-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Назва</th>
                                <th>Автор</th>
                                <th>Категорія</th>
                                <th>Ціна</th>
                                <th>На складі</th>
                                <th>Дії</th>
                            </tr>
                        </thead>
                        <tbody>
                            {books.map(book => (
                                <tr key={book.id}>
                                    <td>{book.id}</td>
                                    <td>{book.title}</td>
                                    <td>{book.author}</td>
                                    <td>{book.category}</td>
                                    <td>{book.price} грн</td>
                                    <td>{book.inStock}</td>
                                    <td>
                                        <button className="btn-edit" onClick={() => handleEditBook(book)}>
                                            Редагувати
                                        </button>
                                        <button className="btn-delete" onClick={() => handleDeleteBook(book.id)}>
                                            Видалити
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

// Сторінка керування замовленнями (для менеджера)
const ManageOrdersPage = ({ orders, updateOrderStatus }) => {
    const statusOptions = ['Новий', 'Оброблений', 'Відправлений', 'Доставлений', 'Скасований'];

    const handleStatusChange = async (orderId, newStatus) => {
        await updateOrderStatus(orderId, newStatus);
    };

    return (
        <div className="manage-orders-page">
            <h2>Керування замовленнями</h2>

            {orders.length === 0 ? (
                <p>Немає замовлень</p>
            ) : (
                <div className="orders-table-container">
                    <table className="orders-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Користувач</th>
                                <th>Дата</th>
                                <th>Сума</th>
                                <th>Статус</th>
                                <th>Деталі</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map(order => (
                                <tr key={order.id}>
                                    <td>{order.id}</td>
                                    <td>{order.userName || order.userEmail}</td>
                                    <td>{new Date(order.date).toLocaleString('uk-UA')}</td>
                                    <td>{order.totalAmount} грн</td>
                                    <td>
                                        <select
                                            value={order.status}
                                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                            className={`status-${order.status.toLowerCase().replace(' ', '-')}`}
                                        >
                                            {statusOptions.map(status => (
                                                <option key={status} value={status}>{status}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td>
                                        <button className="btn-details" onClick={() => alert(`Деталі замовлення №${order.id}:\n${JSON.stringify(order.items, null, 2)}`)}>
                                            Деталі
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

// Сторінка профілю
const AccountPage = ({ user, logout, managerAccount }) => {
    return (
        <div className="account-page">
            <h2>Профіль</h2>

            <div className="account-info">
                <p><strong>Ім'я:</strong> {user.name}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Роль:</strong> {user.role === 'manager' ? 'Менеджер' : 'Покупець'}</p>

                {user.role === 'manager' && (
                    <div className="manager-account">
                        <h3>Рахунок менеджера</h3>
                        <p><strong>Баланс:</strong> {managerAccount.balance} грн</p>
                    </div>
                )}
            </div>

            <button className="btn-logout" onClick={logout}>
                Вийти з системи
            </button>
        </div>
    );
};

// Рендерінг головного компонента
ReactDOM.render(<App />, document.getElementById('root'));