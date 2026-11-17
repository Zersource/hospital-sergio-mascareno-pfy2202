// Datos del servidor simulado. Cada categoria lleva su "id" (se usa en la URL y en la consulta ?genre=).
export const categorias = [
  { id: 'ficcion', nombre: 'Ficción', descripcion: 'Novelas y cuentos de mundos inventados y vidas posibles.' },
  { id: 'ciencia-ficcion', nombre: 'Ciencia Ficción', descripcion: 'Futuros, tecnología y preguntas sobre lo que viene.' },
  { id: 'fantasia', nombre: 'Fantasía', descripcion: 'Magia, héroes y reinos que solo existen en el papel.' },
  { id: 'drama', nombre: 'Drama', descripcion: 'Historias intensas centradas en los conflictos humanos.' },
  { id: 'poesia', nombre: 'Poesía', descripcion: 'Versos de autores latinoamericanos.' },
]

// Para "drama" el arreglo queda vacio a proposito: sirve para ver la pantalla "sin libros".
export const librosPorGenero = {
  ficcion: [
    { id: 1, title: 'Cien años de soledad', author: 'Gabriel García Márquez', price: 14500 },
    { id: 2, title: 'La casa de los espíritus', author: 'Isabel Allende', price: 12500 },
    { id: 3, title: 'Pedro Páramo', author: 'Juan Rulfo', price: 8500 },
    { id: 4, title: 'El túnel', author: 'Ernesto Sabato', price: 7500 },
  ],
  'ciencia-ficcion': [
    { id: 5, title: 'Fahrenheit 451', author: 'Ray Bradbury', price: 9500 },
    { id: 6, title: 'Dune', author: 'Frank Herbert', price: 16500 },
    { id: 7, title: 'Neuromante', author: 'William Gibson', price: 11500 },
    { id: 8, title: 'Fundación', author: 'Isaac Asimov', price: 10500 },
  ],
  fantasia: [
    { id: 9, title: 'El hobbit', author: 'J. R. R. Tolkien', price: 12000 },
    { id: 10, title: 'Un mago de Terramar', author: 'Ursula K. Le Guin', price: 9000 },
    { id: 11, title: 'La historia interminable', author: 'Michael Ende', price: 13500 },
  ],
  drama: [],
  poesia: [
    { id: 12, title: 'Veinte poemas de amor y una canción desesperada', author: 'Pablo Neruda', price: 6500 },
    { id: 13, title: 'Altazor', author: 'Vicente Huidobro', price: 7000 },
    { id: 14, title: 'Desolación', author: 'Gabriela Mistral', price: 7500 },
  ],
}
