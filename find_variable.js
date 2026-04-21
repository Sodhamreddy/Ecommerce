async function test() {
  const res = await fetch('https://backend.jerseyperfume.com/wp-json/wc/store/v1/products?per_page=100');
  const data = await res.json();
  const variable = data.filter(p => p.type === 'variable');
  if (variable.length > 0) {
    console.log('Found variable product:', variable[0].name, 'ID:', variable[0].id);
    console.log('Variation Attribute structure:', JSON.stringify(variable[0].attributes, null, 2));
  } else {
    console.log('No variable products found in first 100.');
  }
}
test();
