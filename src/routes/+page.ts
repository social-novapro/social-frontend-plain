import type { PageLoad } from './$types';
import {interact} from 'interact-js-helper';

export const load: PageLoad = async ({ fetch, params }) => {
    // const response = await fetch('//auth/check');
    // const user = await response.json();

console.log(    interact('user'))    
    // if (!user || !user.loggedIn) {
    //     // Redirect to login page if not logged in
    //     return {
    //         status: 302,
    //         redirect: '/login'
    //     };
    // }

    // // Continue loading the page if logged in
    // return {
    //     props: {
    //         user
    //     }
    // };
};