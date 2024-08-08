const express = require('express')
const path = require('path')
const { open } = require('sqlite')
const sqlite3 = require('sqlite3')
const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'moviesData.db')

let db = null
const initializationDBmovies = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('The localhost server is running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB server: ${e.message}`)
    process.exit(1)
  }
}

initializationDBmovies()

const convertObjectToResponseObject = dbObject => {
  return {
    movieId: dbObject.movie_id,
    directorId: dbObject.director_id,
    movieName: dbObject.movie_name,
    leadActor: dbObject.lead_actor,
  }
}

const directorObjectToResponseObject = dbObject => {
  return {
    directorId: dbObject.director_id,
    directorName: dbObject.director_name,
  }
}

// GET request to fetch all movies
app.get('/movies/', async (request, response) => {
  const getMovies = `
    SELECT 
      movie_name
    FROM  
      movie;
  `
  const movieArray = await db.all(getMovies)
  response.send(
    movieArray.map(eachMovie => ({
      movieName: eachMovie.movie_name,
    })),
  )
})

// POST request to add a new movie
app.post('/movies/', async (request, response) => {
  const movieDetails = request.body
  const { directorId, movieName, leadActor } = movieDetails
  try {
    const addMovies = `INSERT INTO 
       movie(director_id, movie_name, lead_actor)
       VALUES (?, ?, ?);
     `
    await db.run(addMovies, [directorId, movieName, leadActor])
    response.send('Movie Successfully Added')
  } catch (error) {
    response.status(500).send('An error occurred while adding the movie')
  }
})

// GET request to fetch a specific movie by movieId
app.get('/movies/:movieId/', async (request, response) => {
  const { movieId } = request.params
  try {
    const getMovie = `
      SELECT 
        * 
      FROM 
        movie 
      WHERE 
        movie_id = ?;
    `
    const movie = await db.get(getMovie, [movieId])
    
    if (movie) {
      response.send(convertObjectToResponseObject(movie))
    } else {
      response.status(404).send('Movie not found')
    }
  } catch (error) {
    response.status(500).send('An error occurred while retrieving the movie details')
  }
})

// PUT request to update a movie by movieId
app.put('/movies/:movieId/', async (request, response) => {
  const { movieId } = request.params
  const { directorId, movieName, leadActor } = request.body
  try {
    const updateMovie = `UPDATE 
      movie 
      SET
       director_id = ?,
       movie_name = ?,
       lead_actor = ?
       WHERE 
       movie_id = ?`

    const result = await db.run(updateMovie, [directorId, movieName, leadActor, movieId])

    if (result.changes > 0) {
      response.send('Movie Details Updated')
    } else {
      response.status(404).send('Movie not found')
    }
  } catch (error) {
    response.status(500).send('An error occurred while updating the movie details')
  }
})

// DELETE request to remove a movie by movieId
app.delete('/movies/:movieId/', async (request, response) => {
  const { movieId } = request.params
  try {
    const deleteMovie = `
      DELETE 
      FROM 
      movie
      WHERE 
      movie_id = ?`
      
    const result = await db.run(deleteMovie, [movieId])
    
    if (result.changes > 0) {
      response.send('Movie Removed')
    } else {
      response.status(404).send('Movie not found')
    }
  } catch (error) {
    response.status(500).send('An error occurred while removing the movie')
  }
})

// GET request to fetch all directors
app.get('/directors/', async (request, response) => {
  const getDirectors = `
    SELECT 
      *
    FROM 
      director;`

  const directorArray = await db.all(getDirectors)
  response.send(
    directorArray.map(director => directorObjectToResponseObject(director))
  )
})

// GET request to fetch all movies by a specific director
app.get('/directors/:directorId/movies/', async (request, response) => {
  const { directorId } = request.params
  try {
    const getMovies = `
      SELECT 
        movie_name 
      FROM 
        movie
      WHERE 
        director_id = ?;
    `
    const movies = await db.all(getMovies, [directorId])
    
    if (movies.length > 0) {
      response.send(
        movies.map(eachMovie => ({
          movieName: eachMovie.movie_name,
        }))
      )
    } else {
      response.status(404).send('No movies found for this director')
    }
  } catch (error) {
    response.status(500).send('An error occurred while retrieving the movies')
  }
})

module.exports = app
