import { json } from '../_shared/admin-auth.js';
export async function onRequestGet({env}) {
  if (!env.DB) return json({categories:[],products:[]});
  try {
    const [c,p]=await Promise.all([
      env.DB.prepare('SELECT id,name,sort_order FROM product_categories WHERE active=1 ORDER BY sort_order,name').all(),
      env.DB.prepare("SELECT p.id,p.name,p.category_id,p.description,p.price_naira,p.status,p.image_url,p.delivery_group FROM products p JOIN product_categories c ON c.id=p.category_id AND c.active=1 WHERE p.status!='hidden' ORDER BY p.created_at DESC").all()
    ]);
    return json({categories:c.results||[],products:p.results||[]});
  } catch(e) { return json({categories:[],products:[],setup_required:true}); }
}
