import './trueShuffle.modules.css'
import Intro from './intro.js'
import Connect from './connect.js'
import Footer from './footer.js'

export default function TrueShuffle() {
    return (
        <>
            <div className='Container'>
                <Intro />
                <Connect />
                <Footer />
            </div>
        </>
    )    
}