import './App.css';
import { Routes, Route } from "react-router-dom";
import Home from './components/Home';
import History from './components/History';
import EditorPage from './components/EditorPage';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <>
    <div>
      <Toaster  position='top-center'></Toaster>
    </div>
    <Routes>
     <Route path='/abc' element={ <History /> } />
     <Route path='/*' element={ <Home /> } />
     <Route path='/editor/:roomId' element={ <EditorPage /> } />
    </Routes>
    </>
  );
}

export default App;
