import './input.css';
import { local } from './utils.js';

document.querySelector('form').addEventListener('submit', (e) => {
    e.preventDefault();
    local.set('username', document.querySelector('#username').value.trim());
    window.location.replace('/createOrJoinRoom/');
});
