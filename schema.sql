CREATE TABLE IF NOT EXISTS orders (
 id TEXT PRIMARY KEY, order_number TEXT NOT NULL UNIQUE, customer_name TEXT NOT NULL, customer_email TEXT NOT NULL, customer_phone TEXT NOT NULL, delivery_address TEXT NOT NULL, amount_kobo INTEGER NOT NULL, currency TEXT NOT NULL DEFAULT 'NGN', payment_reference TEXT NOT NULL UNIQUE, payment_status TEXT NOT NULL DEFAULT 'pending', fulfilment_status TEXT NOT NULL DEFAULT 'order_received', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS order_items (
 id INTEGER PRIMARY KEY AUTOINCREMENT, order_id TEXT NOT NULL REFERENCES orders(id), product_id TEXT, item_name TEXT NOT NULL, quantity INTEGER NOT NULL DEFAULT 1, unit_amount_kobo INTEGER NOT NULL, item_data TEXT
);
CREATE INDEX IF NOT EXISTS idx_orders_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_reference ON orders(payment_reference);
