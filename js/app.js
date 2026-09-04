
const SUPABASE_URL="https://jppjmebhbslyivzjhezy.supabase.co";
const SUPABASE_KEY="sb_publishable_Ts9c4GRcwl6DDc0xflH8wg_ck_jK_ad";
const db=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
let state={user:null,business:null,page:"dashboard",cache:{}};

function toast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2800)}
function money(n){return new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(Number(n)||0)}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function openModal(html){$("#modalContent").innerHTML=html;$("#modal").classList.remove("hidden")}
function closeModal(){$("#modal").classList.add("hidden")}
$("#closeModal").onclick=closeModal;$(".modal-backdrop").onclick=closeModal;

async function boot(){
  // No indefinite loading: show the shell after a short maximum boot window.
  const timeout=new Promise(r=>setTimeout(()=>r({data:{session:null}}),1800));
  const session=await Promise.race([db.auth.getSession(),timeout]);
  state.user=session?.data?.session?.user||null;
  if(state.user) await loadBusiness();
  $("#boot").classList.add("hidden");$("#app").classList.remove("hidden");
  $("#connection").classList.add("online");$("#connection").innerHTML="<i></i> "+(state.user?"Supabase connected":"Demo mode");
  render();
}
async function loadBusiness(){
  const {data}=await db.from("profiles").select("business_id,full_name,businesses(name)").eq("id",state.user.id).maybeSingle();
  state.business=data?.business_id?data:null;
}
function requireAuth(){if(!state.user){toast("Sign in to save data. You can still explore the interface.");return false}return true}
async function q(table,select="*"){const {data,error}=await db.from(table).select(select);if(error)throw error;return data||[]}
async function safe(table,select){try{return await q(table,select)}catch(e){console.warn(table,e);return[]}}

function render(){
  $$("#nav button").forEach(b=>b.classList.toggle("active",b.dataset.page===state.page));
  const pages={dashboard:dashboard,sales:sales,purchases:purchases,inventory:inventory,products:products,customers:customers,manufacturers:manufacturers,payments:payments,expenses:expenses,market:market,analytics:analytics};
  (pages[state.page]||dashboard)();
}
function head(title,sub,action=""){return `<div class="page-head"><div><div class="eyebrow">NEXORA / ${state.page}</div><h1>${title}</h1><div class="sub">${sub}</div></div>${action}</div>`}
function stat(label,val,note=""){return `<div class="card"><div class="stat-label">${label}</div><div class="stat-value">${val}</div><div class="trend">${note}</div></div>`}
function table(title,headers,rows){return `<div class="card table-card"><div class="table-title">${title}</div><div class="table-wrap"><table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.length?rows.join(""):`<tr><td colspan="${headers.length}"><div class="empty">No records yet</div></td></tr>`}</tbody></table></div></div>`}

async function dashboard(){
 $("#page").innerHTML=head("Good to see you.","Your business at a glance.")+`<div class="grid stats">${[1,2,3,4].map(()=>`<div class="card"><div class="skeleton"></div><div class="skeleton" style="margin-top:14px;width:65%"></div></div>`).join("")}</div>`;
 const [salesD,purD,prod,customers,payments,expenses]=await Promise.all([safe("sales","total,gross_profit,created_at,invoice_no"),safe("purchases","total,created_at,purchase_no"),safe("products","name,sku,selling_price,purchase_price,stock,min_stock"),safe("customers","name,phone"),safe("payments","amount,type,created_at"),safe("expenses","amount,category,created_at")]);
 const revenue=salesD.reduce((a,x)=>a+Number(x.total||0),0),profit=salesD.reduce((a,x)=>a+Number(x.gross_profit||0),0),inv=prod.reduce((a,x)=>a+Number(x.purchase_price||0)*Number(x.stock||0),0),due=customers.length;
 $("#page").innerHTML=head("Command center","Live overview of sales, inventory and cash flow.",`<button class="primary" onclick="newRecord()">＋ New transaction</button>`)+
 `<div class="grid stats">${stat("Revenue",money(revenue),"From recorded sales")}${stat("Gross profit",money(profit),"Calculated at sale")}${stat("Inventory value",money(inv),"At purchase cost")}${stat("Customers",customers.length,"Active records")}</div><br>
 <div class="grid two">${table("Recent sales",["Invoice","Date","Total"],salesD.slice(-7).reverse().map(x=>`<tr><td>${esc(x.invoice_no)}</td><td>${new Date(x.created_at).toLocaleDateString("en-IN")}</td><td>${money(x.total)}</td></tr>`))}${table("Stock watch",["Product","Stock","Status"],prod.filter(x=>Number(x.stock)<=Number(x.min_stock||0)).slice(0,7).map(x=>`<tr><td>${esc(x.name)}</td><td>${x.stock}</td><td class="${Number(x.stock)===0?"bad":"warn"}">${Number(x.stock)===0?"OUT":"LOW"}</td></tr>`))}</div>`;
}
async function listGeneric(title,sub,tableName,cols,select,addForm){
 const data=await safe(tableName,select); const rows=data.map(x=>`<tr>${cols.map(c=>`<td>${esc(typeof x[c.key]==="object"?Object.values(x[c.key]||{})[0]:x[c.key])}</td>`).join("")}</tr>`);
 $("#page").innerHTML=head(title,sub,`<button class="primary" onclick="${addForm}">＋ Add</button>`)+table(title,cols.map(c=>c.label),rows)
}
function products(){listGeneric("Products","Catalog, pricing and stock.","products",[{key:"sku",label:"SKU"},{key:"name",label:"Product"},{key:"purchase_price",label:"Buy"},{key:"selling_price",label:"Sell"},{key:"stock",label:"Stock"}],"sku,name,purchase_price,selling_price,stock,min_stock","productForm()")}
function customers(){listGeneric("Customers","Your customer directory.","customers",[{key:"name",label:"Name"},{key:"phone",label:"Phone"},{key:"email",label:"Email"},{key:"created_at",label:"Added"}],"name,phone,email,created_at","customerForm()")}
function manufacturers(){listGeneric("Manufacturers","Suppliers and manufacturing partners.","manufacturers",[{key:"company_name",label:"Company"},{key:"contact_name",label:"Contact"},{key:"phone",label:"Phone"},{key:"created_at",label:"Added"}],"company_name,contact_name,phone,created_at","manufacturerForm()")}
function inventory(){listGeneric("Inventory","Stock levels and reorder signals.","products",[{key:"sku",label:"SKU"},{key:"name",label:"Product"},{key:"stock",label:"Units"},{key:"min_stock",label:"Minimum"},{key:"purchase_price",label:"Value/unit"}],"sku,name,stock,min_stock,purchase_price","productForm()")}
function sales(){listGeneric("Sales","Invoices and recorded revenue.","sales",[{key:"invoice_no",label:"Invoice"},{key:"total",label:"Total"},{key:"paid_amount",label:"Paid"},{key:"due_amount",label:"Due"},{key:"created_at",label:"Date"}],"invoice_no,total,paid_amount,due_amount,created_at","quickSale()")}
function purchases(){listGeneric("Purchases","Supplier purchases and incoming stock.","purchases",[{key:"purchase_no",label:"Purchase"},{key:"total",label:"Total"},{key:"paid_amount",label:"Paid"},{key:"due_amount",label:"Due"},{key:"created_at",label:"Date"}],"purchase_no,total,paid_amount,due_amount,created_at","quickPurchase()")}
function payments(){listGeneric("Payments","Money received and money paid.","payments",[{key:"type",label:"Type"},{key:"amount",label:"Amount"},{key:"method",label:"Method"},{key:"created_at",label:"Date"}],"type,amount,method,created_at","quickPayment()")}
function expenses(){listGeneric("Expenses","Operating costs and outgoing cash.","expenses",[{key:"category",label:"Category"},{key:"description",label:"Description"},{key:"amount",label:"Amount"},{key:"created_at",label:"Date"}],"category,description,amount,created_at","quickExpense()")}
function market(){listGeneric("Market intelligence","Track products and opportunities available in your market.","market_items",[{key:"name",label:"Opportunity"},{key:"category",label:"Category"},{key:"estimated_demand",label:"Demand"},{key:"status",label:"Status"}],"name,category,estimated_demand,status","marketForm()")}
async function analytics(){
 const s=await safe("sales","total,gross_profit,created_at");const p=await safe("purchases","total,created_at");
 const rev=s.reduce((a,x)=>a+Number(x.total||0),0),gp=s.reduce((a,x)=>a+Number(x.gross_profit||0),0),buy=p.reduce((a,x)=>a+Number(x.total||0),0);
 $("#page").innerHTML=head("Analytics","Financial performance from your database.")+`<div class="grid stats">${stat("Revenue",money(rev),"All sales")}${stat("Gross profit",money(gp),"All recorded sales")}${stat("Purchases",money(buy),"All purchases")}${stat("Margin",rev?(gp/rev*100).toFixed(1)+"%":"0%","Gross margin")}</div><br><div class="card"><h3>Business health</h3><p class="sub">Revenue ${money(rev)} vs purchases ${money(buy)}. Add more transactions to make this panel increasingly useful.</p></div>`;
}

function productForm(){openModal(`<h2>Add product</h2><form class="form" onsubmit="saveProduct(event)"><div class="form-grid"><div class="field"><label>Product name</label><input name="name" required></div><div class="field"><label>SKU</label><input name="sku" required></div><div class="field"><label>Purchase price</label><input name="purchase_price" type="number" step=".01" required></div><div class="field"><label>Selling price</label><input name="selling_price" type="number" step=".01" required></div><div class="field"><label>Opening stock</label><input name="stock" type="number" value="0"></div><div class="field"><label>Minimum stock</label><input name="min_stock" type="number" value="5"></div></div><button class="primary">Save product</button></form>`)}
function customerForm(){openModal(`<h2>Add customer</h2><form class="form" onsubmit="saveSimple(event,'customers')"><div class="form-grid"><div class="field"><label>Name</label><input name="name" required></div><div class="field"><label>Phone</label><input name="phone"></div><div class="field"><label>Email</label><input name="email" type="email"></div></div><button class="primary">Save customer</button></form>`)}
function manufacturerForm(){openModal(`<h2>Add manufacturer</h2><form class="form" onsubmit="saveSimple(event,'manufacturers')"><div class="form-grid"><div class="field"><label>Company</label><input name="company_name" required></div><div class="field"><label>Contact</label><input name="contact_name"></div><div class="field"><label>Phone</label><input name="phone"></div></div><button class="primary">Save manufacturer</button></form>`)}
function quickPayment(){openModal(`<h2>Record payment</h2><form class="form" onsubmit="saveSimple(event,'payments')"><div class="form-grid"><div class="field"><label>Type</label><select name="type"><option value="received">Received</option><option value="sent">Sent</option></select></div><div class="field"><label>Amount</label><input name="amount" type="number" step=".01" required></div><div class="field"><label>Method</label><select name="method"><option>Cash</option><option>UPI</option><option>Bank</option><option>Card</option></select></div></div><button class="primary">Save payment</button></form>`)}
function quickExpense(){openModal(`<h2>Add expense</h2><form class="form" onsubmit="saveSimple(event,'expenses')"><div class="form-grid"><div class="field"><label>Category</label><input name="category" required></div><div class="field"><label>Amount</label><input name="amount" type="number" step=".01" required></div></div><div class="field"><label>Description</label><input name="description"></div><button class="primary">Save expense</button></form>`)}
function marketForm(){openModal(`<h2>Market opportunity</h2><form class="form" onsubmit="saveSimple(event,'market_items')"><div class="form-grid"><div class="field"><label>Name</label><input name="name" required></div><div class="field"><label>Category</label><input name="category"></div><div class="field"><label>Estimated demand</label><input name="estimated_demand"></div><div class="field"><label>Status</label><select name="status"><option>watch</option><option>opportunity</option><option>active</option></select></div></div><button class="primary">Save opportunity</button></form>`)}
function quickSale(){openModal(`<h2>New sale</h2><p class="sub">For the full transaction builder, use the product IDs from your Products table.</p><form class="form" onsubmit="saveSale(event)"><div class="field"><label>Product UUID</label><input name="product_id" required placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"></div><div class="form-grid"><div class="field"><label>Quantity</label><input name="qty" type="number" min="1" value="1"></div><div class="field"><label>Paid now</label><input name="paid" type="number" step=".01" value="0"></div></div><button class="primary">Create sale</button></form>`)}
function quickPurchase(){openModal(`<h2>New purchase</h2><p class="sub">For the full transaction builder, use the product UUID.</p><form class="form" onsubmit="savePurchase(event)"><div class="field"><label>Product UUID</label><input name="product_id" required></div><div class="form-grid"><div class="field"><label>Quantity</label><input name="qty" type="number" min="1" value="1"></div><div class="field"><label>Paid now</label><input name="paid" type="number" step=".01" value="0"></div></div><button class="primary">Create purchase</button></form>`)}
async function saveProduct(e){e.preventDefault();if(!requireAuth())return;const o=Object.fromEntries(new FormData(e));o.purchase_price=+o.purchase_price;o.selling_price=+o.selling_price;o.stock=+o.stock;o.min_stock=+o.min_stock;const {error}=await db.rpc("create_product",{p_name:o.name,p_sku:o.sku,p_purchase_price:o.purchase_price,p_selling_price:o.selling_price,p_stock:o.stock,p_min_stock:o.min_stock});if(error)toast(error.message);else{closeModal();toast("Product saved");render()}}
async function saveSimple(e,table){e.preventDefault();if(!requireAuth())return;const o=Object.fromEntries(new FormData(e));if(o.amount)o.amount=+o.amount;const {error}=await db.rpc("create_"+table,{p_data:o});if(error)toast(error.message);else{closeModal();toast("Saved successfully");render()}}
async function saveSale(e){e.preventDefault();if(!requireAuth())return;const o=Object.fromEntries(new FormData(e));const {data,error}=await db.rpc("create_sale",{p_customer_id:null,p_items:[{product_id:o.product_id,quantity:+o.qty}],p_paid_amount:+o.paid});if(error)toast(error.message);else{closeModal();toast("Sale created");render()}}
async function savePurchase(e){e.preventDefault();if(!requireAuth())return;const o=Object.fromEntries(new FormData(e));const {data,error}=await db.rpc("create_purchase",{p_manufacturer_id:null,p_items:[{product_id:o.product_id,quantity:+o.qty}],p_paid_amount:+o.paid});if(error)toast(error.message);else{closeModal();toast("Purchase created");render()}}

function newRecord(){openModal(`<h2>New transaction</h2><div class="grid"><button class="btn" onclick="closeModal();quickSale()">↗ Record sale</button><button class="btn" onclick="closeModal();quickPurchase()">↙ Record purchase</button><button class="btn" onclick="closeModal();quickPayment()">₹ Record payment</button><button class="btn" onclick="closeModal();quickExpense()">− Add expense</button><button class="btn" onclick="closeModal();productForm()">◇ Add product</button></div>`)}
$("#newBtn").onclick=newRecord;$("#refresh").onclick=render;
$("#nav").onclick=e=>{const b=e.target.closest("button");if(b){state.page=b.dataset.page;render();$("#sidebar")?.classList.remove("open")}}
$("#menu").onclick=()=>$(".sidebar").classList.toggle("open");
$("#logout").onclick=async()=>{await db.auth.signOut();state.user=null;toast("Logged out");render()};
$("#globalSearch").oninput=()=>{const q=$("#globalSearch").value.toLowerCase();if(!q)return;document.querySelectorAll("tbody tr").forEach(r=>r.style.display=r.textContent.toLowerCase().includes(q)?"":"none")};
boot();
