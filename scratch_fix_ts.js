const fs = require('fs');

function replaceAll(content, search, replace) {
  return content.split(search).join(replace);
}

// 1. trpc.ts
let trpc = fs.readFileSync('src/server/trpc.ts', 'utf8');
trpc = trpc.replace(/\|\| user\.role === 'VENDOR'/g, '');
trpc = trpc.replace(/const vendor = await ctx\.prisma\.vendor\.findUnique\(\{ where: \{ userId: user\.id \} \}\);/, '');
trpc = trpc.replace(/vendorId: vendor\?.id,/g, '');
fs.writeFileSync('src/server/trpc.ts', trpc);

// 2. types/index.ts
let types = fs.readFileSync('src/types/index.ts', 'utf8');
types = types.replace(/Vendor, /g, '');
types = types.replace(/vendor\?: Vendor \| null;/g, '');
fs.writeFileSync('src/types/index.ts', types);

// 3. user.ts
let user = fs.readFileSync('src/server/routers/user.ts', 'utf8');
user = user.replace(/vendor: \{ select: \{ shopName: true \} \},/g, '');
fs.writeFileSync('src/server/routers/user.ts', user);

// 4. order.ts
let order = fs.readFileSync('src/server/routers/order.ts', 'utf8');
order = order.replace(/vendor: \{ select: \{ shopName: true, phone: true \} \},/g, '');
order = order.replace(/const vendorGroup = items\.reduce\(\(acc, item\) => \{[^]*?\}\);/g, '');
order = order.replace(/const vendorId = Object\.keys\(vendorGroup\)\[0\];/g, '');
order = order.replace(/const groupItems = vendorGroup\[vendorId\];/g, '');
order = order.replace(/const vendorAmount = groupItems\.reduce\(\(acc: number, item: any\) => acc \+ \(item\.price \* item\.quantity\) \* \(1 - \(item\.product\.vendor\?.commissionRate \|\| 0\.1\)\), 0\);/g, '');
order = order.replace(/const commission = groupItems\.reduce\(\(acc: number, item: any\) => acc \+ \(item\.price \* item\.quantity\) \* \(item\.product\.vendor\?.commissionRate \|\| 0\.1\), 0\);/g, '');
order = order.replace(/vendorId,/g, '');
order = order.replace(/vendorAmount,/g, '');
order = order.replace(/commission,/g, '');
order = order.replace(/vendor: \{ select: \{ shopName: true \} \},/g, '');
order = order.replace(/await pusherServer\.trigger\(CHANNELS\.VENDOR\(vendorId\), EVENTS\.NEW_ORDER, \{ orderId: order\.id \}\);/g, '');
fs.writeFileSync('src/server/routers/order.ts', order);

// 5. product.ts
let product = fs.readFileSync('src/server/routers/product.ts', 'utf8');
product = product.replace(/vendor: \{ select: \{ shopName: true, city: true, commissionRate: true \} \},/g, '');
product = product.replace(/vendor: \{ select: \{ shopName: true \} \},/g, '');
product = product.replace(/vendorId: z\.string\(\)\.optional\(\),/g, '');
product = product.replace(/vendorId: z\.string\(\),/g, '');
product = product.replace(/vendorId,/g, '');
product = product.replace(/vendorId: input\.vendorId,/g, '');
product = product.replace(/vendor: \{ select: \{ id: true, shopName: true, city: true, description: true \} \},/g, '');
product = product.replace(/const vendor = await ctx\.prisma\.vendor\.findUnique\(\{ where: \{ id: input\.vendorId \} \}\);\s*if \(!vendor\) \{[^]*?\}/g, '');
fs.writeFileSync('src/server/routers/product.ts', product);

// 6. community.ts
let community = fs.readFileSync('src/server/routers/community.ts', 'utf8');
community = community.replace(/vendor: \{ select: \{ shopName: true, logo: true \} \}/g, '');
fs.writeFileSync('src/server/routers/community.ts', community);

console.log("Done fixing simple TS errors");
