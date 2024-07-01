import './footer.modules.css'

export default function Footer() {
    
    return (
        <div className="Footer">
            <div className='Footer-container'>
                site built by theodore tasman in react.js
            </div>
            <div className='Footer-bar' style={{color:'#bbbbbb'}}></div>
            <div className="Footer-container">
                <div className="Footer-section">
                    <a href='https://ttasman.com' className='Footer-button'>ttasman.com</a>
                    <a href='https://github.com/tedtasman' className='Footer-button'>GitHub</a>
                </div>
            </div>
        </div>
    );
}
