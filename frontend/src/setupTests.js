import "@testing-library/jest-dom";
import { TextEncoder, TextDecoder } from "util";

// react-router v7 needs these globals, which Jest 27's jsdom environment lacks.
Object.assign(global, { TextEncoder, TextDecoder });
