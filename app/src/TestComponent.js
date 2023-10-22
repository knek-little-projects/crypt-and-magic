import { useEffect, useState } from "react";
import MetaMask from "./MetaMask";

export default function TestComponent() {
    const [counter, setCounter] = useState(0)

    async function run() {
        setCounter(counter => counter + 1);
    }

    useEffect(() => {
        console.log("QWE")
        run()
        run()
        run()
        run()
        run()
    }, [])
    return (
        <div>
            {counter}
        </div>
    )
}