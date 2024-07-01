import './trueShuffle.modules.css'
import Intro from './intro.js'
import Connect from './connect.js'
import Footer from './footer.js'

export default function TrueShuffle() {
    return (
        <>
            <Intro />
            <div className='Container'>
                <Connect />
            </div>
            <Footer />
        </>
    )    
}