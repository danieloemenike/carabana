import React from 'react'
import Menu from './_components/Menu';
import Header from '../../../../components/Header';
import Hero from '../_components/Hero';

type Props = {}

function RegularPage({}: Props) {
    return (
        <section className='bg-gradient-to-r from-orange-800/10 via-black to-zinc-800/15 '>
           <Hero path="/clubb1.jpg" title="A Classy Affair, Every Night" />
            <Menu/>
        </section>
    );
}

export default RegularPage