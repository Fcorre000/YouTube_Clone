'use client';

import Image from "next/image";
import Link from "next/link";
import styles from "./navbar.module.css";
import SignIn from "./sign-in";
import Upload from "./upload";
import { useTheme } from "../context/theme";

import { onAuthStateChangedHelper } from "../firebase/firebase";
import {useEffect, useState} from "react";
import {User} from "firebase/auth";

export default function Navbar() {
    //init user state
    const  [user, setUser] = useState<User | null>(null);
    const { theme, toggleTheme } = useTheme();

    useEffect(() => {
        const unsubscribe = onAuthStateChangedHelper((user) =>{
            setUser(user);
        });
        return () => unsubscribe();
    });

    return (
        <nav className={styles.nav}>
            <Link href="/">
                <Image
                    width={180}
                    height={40}
                    src={theme === 'light' ? '/youtube-logo.svg' : '/YouTube_2024_(white_text).svg'}
                    alt="YouTube Logo"
                />
            </Link>
            {
                user && <Upload />
            }
            <div className={styles.navRight}>
                <button onClick={toggleTheme} className={styles.themeToggle}>
                    {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
                </button>
                <SignIn user = {user} />
            </div>
        </nav>
    ); 
}