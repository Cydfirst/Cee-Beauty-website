
import { isAdmin, json } from '../../_shared/admin-auth.js';

const productStatuses = new Set(['in_stock', 'out_of_stock', 'available_on_request', 'pre_order', 'hidden']);
const deliveryGroups = new Set(['hair', 'other']);

export async function onRequest({ request, env }) {
  if (!await isAdmin(request, env)) return json({ error: 'Please log in.' }, 401);
  if (!env.DB) return json({ error: 'D1 database binding DB is missing.' }, 503);

  try {
    if (request.method === 'GET') {
      const [categories, products] = await Promise.all([
        env.DB.prepare('SELECT id,name,sort_order,active FROM product_categories ORDER BY sort_order,name').all(),
        env.DB.prepare('SELECT id,name,category_id,description,price_naira,status,image_url,delivery_group FROM products ORDER BY created_at DESC').all()
      ]);
      return json({ categories: categories.results || [], products: products.results || [] });
    }

    const body = await request.json();
    if (request.method === 'POST' && body.type === 'category') {
      const name = String(body.name || '').trim().slice(0, 80);
      if (!name) return json({ error: 'Enter a category name.' }, 400);
      const order = Number(body.sort_order);
      const id = crypto.randomUUID();
      await env.DB.prepare('INSERT INTO product_categories (id,name,sort_order,active) VALUES (?,?,?,1)')
        .bind(id, name, Number.isFinite(order) ? order : 0).run();
      return json({ ok: true, id });
    }

    if (request.method === 'PUT' && body.type === 'category') {
      const id = String(body.id || '').trim();
      const name = String(body.name || '').trim().slice(0, 80);
      const order = Number(body.sort_order);
      if (!id || !name) return json({ error: 'Category name is required.' }, 400);
      const result = await env.DB.prepare('UPDATE product_categories SET name=?,sort_order=?,active=? WHERE id=?')
        .bind(name, Number.isFinite(order) ? order : 0, body.active === false ? 0 : 1, id).run();
      if (Number(result.meta?.changes || 0) !== 1) return json({ error: 'Category not found.' }, 404);
      return json({ ok: true });
    }

    if (request.method === 'POST' || request.method === 'PUT') {
      const id = String(body.id || '').trim();
      const name = String(body.name || '').trim().slice(0, 180);
      const category = String(body.category_id || '').trim();
      const price = Number(body.price_naira);
      const status = String(body.status || 'in_stock');
      const delivery = String(body.delivery_group || 'other');
      const image = String(body.image_url || '').trim().slice(0, 500);
      const description = String(body.description || '').slice(0, 1000);
      if (!name || !category || !Number.isFinite(price) || price <= 0) return json({ error: 'Product name, category and a valid price are required.' }, 400);
      if (!productStatuses.has(status) || !deliveryGroups.has(delivery)) return json({ error: 'Choose a valid availability and delivery option.' }, 400);
      const activeCategory = await env.DB.prepare('SELECT id FROM product_categories WHERE id=? AND active=1').bind(category).first();
      if (!activeCategory) return json({ error: 'Choose an active product category.' }, 400);
      if (request.method === 'POST') {
        const newId = crypto.randomUUID();
        await env.DB.prepare('INSERT INTO products (id,name,category_id,description,price_naira,status,image_url,delivery_group) VALUES (?,?,?,?,?,?,?,?)')
          .bind(newId, name, category, description, price, status, image, delivery).run();
        return json({ ok: true, id: newId });
      }
      if (!id) return json({ error: 'Product ID is missing.' }, 400);
      const result = await env.DB.prepare('UPDATE products SET name=?,category_id=?,description=?,price_naira=?,status=?,image_url=?,delivery_group=?,updated_at=CURRENT_TIMESTAMP WHERE id=?')
        .bind(name, category, description, price, status, image, delivery, id).run();
      if (Number(result.meta?.changes || 0) !== 1) return json({ error: 'Product not found.' }, 404);
      return json({ ok: true });
    }

    if (request.method === 'DELETE') {
      if (body.type === 'category') {
        const id = String(body.id || '').trim();
        if (!id) return json({ error: 'Category ID is missing.' }, 400);
        await env.DB.prepare('UPDATE product_categories SET active=0 WHERE id=?').bind(id).run();
        await env.DB.prepare("UPDATE products SET status='hidden',updated_at=CURRENT_TIMESTAMP WHERE category_id=?").bind(id).run();
      } else {
        const id = String(body.id || '').trim();
        if (!id) return json({ error: 'Product ID is missing.' }, 400);
        await env.DB.prepare("UPDATE products SET status='hidden',updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(id).run();
      }
      return json({ ok: true });
    }
    return json({ error: 'Method not allowed.' }, 405);
  } catch (error) {
    return json({ error: 'Could not save catalogue changes. Check the category name and try again.' }, 400);
  }
}
