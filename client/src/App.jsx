import Lobby from './screens/Lobby';
import './App.css'
import {Routes, Route} from 'react-router-dom';
import Room from './screens/Room';
import Room2 from './screens/Room2';
import Room3 from './screens/Room3';
import Room4 from './screens/Room4';

function App() {

  return (
    <>
    <Routes>
      <Route path='/' element={<Lobby />}></Route>
      <Route path='/room/:roomId' element={<Room />}></Route>
      <Route path='/room2/:roomId' element={<Room2 />}></Route>
      <Route path='/room3/:roomId' element={<Room3 />}></Route>
      <Route path='/room4/:roomId' element={<Room4 />}></Route>
    </Routes>
    </>
  )
}

export default App
