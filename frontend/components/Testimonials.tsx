
import React from 'react';
import { StarIcon } from './icons/StarIcon';

interface Testimonial {
    quote: string;
    name: string;
    city: string;
    rating: number;
}

interface TestimonialCardProps {
    testimonial: Testimonial;
}

interface TestimonialsProps {
    testimonials: Testimonial[];
}

const TestimonialCard: React.FC<TestimonialCardProps> = ({ testimonial }) => (
    <div className="bg-white p-8 rounded-xl shadow-lg flex flex-col items-center text-center transform hover:-translate-y-2 transition-transform duration-300">
        <div className="flex text-yellow-400 mb-4">
            {[...Array(5)].map((_, i) => (
                <StarIcon key={i} className={`w-6 h-6 ${i < testimonial.rating ? 'fill-current' : 'text-gray-300'}`} />
            ))}
        </div>
        <blockquote className="text-gray-600 italic mb-4">"{testimonial.quote}"</blockquote>
        <div className="mt-auto">
            <p className="font-bold text-lg text-dark">{testimonial.name}</p>
            <p className="text-sm text-gray-500">{testimonial.city}</p>
        </div>
    </div>
);

export const Testimonials: React.FC<TestimonialsProps> = ({ testimonials }) => {
    return (
        <section id="about" className="py-16 sm:py-24 bg-gray-50">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h2 className="text-4xl font-display font-bold text-dark sm:text-5xl">Lo que dicen nuestros clientes</h2>
                    <p className="mt-4 text-lg text-gray-600">¡Nos enorgullece servir comida que la gente ama!</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {testimonials.map((testimonial, index) => (
                        <TestimonialCard key={index} testimonial={testimonial} />
                    ))}
                </div>
            </div>
        </section>
    );
};
