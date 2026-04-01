import React from "react";
import { Box } from "lucide-react";
import Button from "../ui/Button";
import {useOutletContext} from "react-router";


const Navbar = () => {
   const {isSignedIn,username,signIn,signOut}= useOutletContext<AuthContext>()

    const handleAuthClick = async () => {
       if (isSignedIn) {
           try {await signOut();
           }catch (e){
               console.error(`puter sign out failed!${e}`);
           }
           return;
       }
       try {
       await signIn();
       }catch (e){
       console.error(`puter sign in failed!${e}`);
   }
};
    return (
        <header className="navbar">
            <nav className="inner">
                <div className="left">
                    <div className="brand ">
                        <Box className="logo" />
                        <span className="name">SyncSpace</span>
                    </div>

                    <ul className="links">
                        <a href="#">Product</a>
                        <a href="#">Pricing</a>
                        <a href="#">Community</a>
                        <a href="#">Enterprise</a>
                    </ul>
                </div>

                <div className="actions">
                    {isSignedIn ? (
                        <>
              <span className="greeting">
                {username ? `Hi, ${username}` : "Signed in"}
              </span>
                            <button onClick={handleAuthClick} className="btn">
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <button onClick={handleAuthClick}   className="login">
                                Log In
                            </button>
                            <a href="#upload" className="cta">Get Started</a>
                        </>
                    )}
                </div>
            </nav>
        </header>
    );
};

export default Navbar;
