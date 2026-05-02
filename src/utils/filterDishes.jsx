export function filterDishes(dishes, searchQuery) {
  if (!searchQuery) return dishes;
  return dishes.filter((dish) =>
    dish.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dish.description.toLowerCase().includes(searchQuery.toLowerCase())
  );
}