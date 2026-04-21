async function testVariations(id) {
  const res = await fetch(`https://backend.jerseyperfume.com/wp-json/wc/store/v1/products/${id}/variations`);
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}
testVariations(11989); // Prada Product ID
