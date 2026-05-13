const fs = require('fs');

let product = fs.readFileSync('src/server/routers/product.ts', 'utf8');

// Imports
product = product.replace(/vendorProcedure/g, 'adminProcedure');

// vendor status checks
product = product.replace(/vendor: \{ status: 'APPROVED' \},/g, '');
product = product.replace(/vendor: \{ status: true \} \},/g, '');
product = product.replace(/vendorId: z\.string\(\)\.optional\(\),/g, '');
product = product.replace(/vendorId,/g, '');

// Vendor filters and selects in queries
product = product.replace(/vendor: \{ select: \{ shopName: true, city: true \} \},/g, '');
product = product.replace(/vendor: \{ select: \{ id: true, shopName: true, city: true, phone: true \} \},/g, '');
product = product.replace(/vendor: \{\s*status: 'APPROVED' as const,\s*city: city \? \{ equals: city, mode: 'insensitive' as const \} : undefined,\s*\},/g, '');
product = product.replace(/vendor: \{\s*city: city \? \{ equals: city, mode: 'insensitive' \} : undefined,\s*id: vendorId,\s*status: 'APPROVED',\s*\},/g, '');
product = product.replace(/vendor: \{\s*status: 'APPROVED',\s*city: city \? \{ equals: city, mode: 'insensitive' \} : undefined,\s*\},\s*/g, '');

// checkCartAvailability
product = product.replace(/&& p\.vendor\.status === 'APPROVED'/g, '');

// myVendorStatus & vendorProducts
product = product.replace(/vendorProducts: adminProcedure[^]*?\}\),/g, '');
product = product.replace(/\/\/ ─── Vendor status check[^]*?\}\),/g, '');

// create mutation
product = product.replace(/if \(ctx\.vendor\.status === 'SUSPENDED'\) \{[^]*?\}\s*if \(ctx\.vendor\.status === 'PENDING'\) \{[^]*?\}/g, '');
product = product.replace(/\/\/ Real-time subscription enforcement[^]*?\}\s*\}/g, '');
product = product.replace(/vendorId: ctx\.vendor\.id,/g, '');
product = product.replace(/actorId: ctx\.vendor\.userId,/g, 'actorId: ctx.user.id,');
product = product.replace(/actorName: ctx\.vendor\.shopName,/g, 'actorName: "Admin",');
product = product.replace(/Vendor \$\{ctx\.vendor\.shopName\}/g, 'Admin');

// update mutation
product = product.replace(/vendorId: ctx\.vendor\.id /g, '');
product = product.replace(/, vendorId: ctx\.vendor\.id /g, '');

// delete mutation
product = product.replace(/, vendorId: ctx\.vendor\.id /g, '');

// getCities
product = product.replace(/getCities:[^]*?\}\),/g, '');

fs.writeFileSync('src/server/routers/product.ts', product);
console.log('Refactored product.ts successfully.');
