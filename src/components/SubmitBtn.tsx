import { useState } from 'react';
import confetti from 'canvas-confetti';

export const SubmitBtn = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [submit, setSubmit] = useState(false);

  const handleSubmit = async () => {
    if (isLoading || submit) return;

    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsLoading(false);
    setSubmit(true);

    confetti({
      particleCount: 150,
      spread: 60,
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <button
        onClick={handleSubmit}
        disabled={isLoading}
        className="bg-black rounded-lg text-sm text-white w-36 h-12 flex justify-center items-center"
      >
        <span className="flex items-center gap-1">
          {isLoading ? (
            <>
              <div className="h-2 w-2 bg-[#d6f539] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="h-2 w-2 bg-[#d6f539] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="h-2 w-2 bg-[#d6f539] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            </>
          ) : submit ? (
            'Success'
          ) : (
            'Submit'
          )}
        </span>
      </button>
    </div>
  );
};
