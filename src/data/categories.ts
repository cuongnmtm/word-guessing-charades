export interface Category {
  id: string;
  name: string;
  emoji: string;
  words: string[];
}

export const categories: Category[] = [
  {
    id: 'movies',
    name: 'Movies',
    emoji: '🎬',
    words: [
      'The Matrix', 'Inception', 'Titanic', 'Avatar', 'Frozen',
      'The Lion King', 'Jurassic Park', 'Star Wars', 'Harry Potter',
      'The Avengers', 'Toy Story', 'Finding Nemo', 'Shrek', 'Jaws',
      'The Godfather', 'Pulp Fiction', 'Forrest Gump', 'The Dark Knight',
      'Gladiator', 'Rocky', 'E.T.', 'Back to the Future', 'Spider-Man',
      'Iron Man', 'Black Panther', 'Deadpool', 'Wonder Woman', 'Batman',
      'The Terminator', 'Alien'
    ]
  },
  {
    id: 'animals',
    name: 'Animals',
    emoji: '🦁',
    words: [
      'Elephant', 'Giraffe', 'Penguin', 'Kangaroo', 'Dolphin',
      'Octopus', 'Flamingo', 'Chameleon', 'Sloth', 'Platypus',
      'Peacock', 'Gorilla', 'Cheetah', 'Hippopotamus', 'Rhinoceros',
      'Crocodile', 'Butterfly', 'Hummingbird', 'Koala', 'Panda',
      'Tiger', 'Lion', 'Bear', 'Wolf', 'Fox', 'Owl', 'Eagle',
      'Shark', 'Whale', 'Jellyfish'
    ]
  },
  {
    id: 'actions',
    name: 'Actions',
    emoji: '🏃',
    words: [
      'Dancing', 'Swimming', 'Sleeping', 'Eating Pizza', 'Brushing Teeth',
      'Driving a Car', 'Playing Guitar', 'Cooking', 'Singing',
      'Taking a Selfie', 'Surfing', 'Rock Climbing', 'Skateboarding',
      'Painting', 'Gardening', 'Fishing', 'Bowling', 'Skydiving',
      'Meditation', 'Yoga', 'Jogging', 'Cycling', 'Boxing',
      'Karate', 'Ice Skating', 'Skiing', 'Snowboarding', 'Horseback Riding',
      'Juggling', 'Magic Tricks'
    ]
  },
  {
    id: 'food',
    name: 'Food & Drinks',
    emoji: '🍕',
    words: [
      'Pizza', 'Sushi', 'Hamburger', 'Ice Cream', 'Chocolate Cake',
      'Spaghetti', 'Tacos', 'Hot Dog', 'Pancakes', 'Donuts',
      'French Fries', 'Popcorn', 'Cotton Candy', 'Apple Pie',
      'Cheese', 'Bacon', 'Avocado', 'Banana Split', 'Milkshake',
      'Coffee', 'Bubble Tea', 'Smoothie', 'Lemonade', 'Orange Juice',
      'Sandwich', 'Burrito', 'Curry', 'Ramen', 'Dumplings', 'Spring Rolls'
    ]
  },
  {
    id: 'professions',
    name: 'Professions',
    emoji: '👔',
    words: [
      'Doctor', 'Teacher', 'Chef', 'Firefighter', 'Police Officer',
      'Astronaut', 'Pilot', 'Dentist', 'Lawyer', 'Engineer',
      'Nurse', 'Veterinarian', 'Artist', 'Musician', 'Actor',
      'Photographer', 'Journalist', 'Scientist', 'Programmer',
      'Architect', 'Plumber', 'Electrician', 'Carpenter', 'Mechanic',
      'Farmer', 'Librarian', 'Barista', 'Hair Stylist', 'Magician',
      'DJ'
    ]
  },
  {
    id: 'sports',
    name: 'Sports',
    emoji: '⚽',
    words: [
      'Football', 'Basketball', 'Tennis', 'Baseball', 'Golf',
      'Swimming', 'Gymnastics', 'Boxing', 'Wrestling', 'Karate',
      'Surfing', 'Skateboarding', 'Snowboarding', 'Ice Hockey',
      'Volleyball', 'Rugby', 'Cricket', 'Badminton', 'Table Tennis',
      'Archery', 'Fencing', 'Rock Climbing', 'Cycling', 'Marathon',
      'Triathlon', 'Polo', 'Lacrosse', 'Squash', 'Bowling', 'Darts'
    ]
  },
  {
    id: 'places',
    name: 'Places',
    emoji: '🗺️',
    words: [
      'Beach', 'Mountain', 'Desert', 'Forest', 'City',
      'Museum', 'Library', 'Hospital', 'Airport', 'Train Station',
      'Shopping Mall', 'Park', 'Zoo', 'Aquarium', 'Theater',
      'Restaurant', 'Cafe', 'Gym', 'School', 'University',
      'Office', 'Factory', 'Farm', 'Castle', 'Temple',
      'Church', 'Mosque', 'Lighthouse', 'Bridge', 'Pyramid'
    ]
  },
  {
    id: 'objects',
    name: 'Objects',
    emoji: '📦',
    words: [
      'Laptop', 'Smartphone', 'Headphones', 'Camera', 'Guitar',
      'Piano', 'Telescope', 'Microscope', 'Umbrella', 'Backpack',
      'Bicycle', 'Skateboard', 'Sunglasses', 'Watch', 'Ring',
      'Book', 'Pencil', 'Scissors', 'Hammer', 'Screwdriver',
      'Key', 'Lock', 'Mirror', 'Clock', 'Lamp',
      'Fan', 'Refrigerator', 'Microwave', 'Television', 'Radio'
    ]
  }
];
