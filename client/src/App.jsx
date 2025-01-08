import Lobby from './screens/Lobby';
import './App.css'
import {Routes, Route} from 'react-router-dom';
import Room from './screens/Room';
import Room2 from './screens/Room2';
import Room3 from './screens/Room3';
import Room4 from './screens/Room4';
import { useState } from 'react';

function App() {
  const [isDoctor, setIsDoctor] = useState("");

  return (
    <div className='w-full'>
    <Routes>
      <Route path='/' element={<Lobby setIsDoctor={setIsDoctor} isDoctor={isDoctor} />}></Route>
      <Route path='/room/:roomId' element={<Room />}></Route>
      <Route path='/room2/:roomId' element={<Room2 />}></Route>
      <Route path='/room3/:roomId' element={<Room3 />}></Route>
      <Route path='/room4/:roomId' element={<Room4 isDoctor={isDoctor} />}></Route>
    </Routes>
    </div>
  )
}

export default App
