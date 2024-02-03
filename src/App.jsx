import { useEffect, useState } from "react";
import "./App.css";
import { useDispatch } from "react-redux";
import authService from './appwrite/auth'
import { login, logout} from "./store/authSlice";
import { Footer, Header } from "./components";
import { Outlet } from "react-router-dom";

function App() {
    const [loading, setLoading] = useState(true)  
    const dispatch = useDispatch()

    useEffect(() => {
        authService.getCurrentUser()
        .then((userData) => {
          if (userData) {
            dispatch(login({userData}))
          } else {
            dispatch(logout())
          }
        })
        .finally(() => setLoading(false))
    }, )
 // At that moment we use conditional rendering its means ham apne hisaab se return karen gyy

    return !loading ? (
      <div className="min-h-screen flex flex-wrap content-between">
        <div className="w-full block">
          <Header/>
          <main>
          TODO  <Outlet/>
          </main>
          <Footer/>
        </div>
      </div>
    ) : null
}

export default App;
