import { useState } from 'react';
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";

export default function Models() {
  const [loading, setLoading] = useState(false);

  const models = [
    {
      id: 1,
      name: "TinyLlama",
      description: "A compact language model for efficient text generation",
      hostAddresses: ["0x1234...5678", "0x8765...4321"],
      numberOfNodes: 2,
      image: "/assets/tinyllama.jpg" // Replace with actual path
    },
    {
      id: 2,
      name: "GPT-2",
      description: "A powerful language model for various NLP tasks",
      hostAddresses: ["0x1111...2222"],
      numberOfNodes: 2,
      image: "/assets/gpt2.jpg" // Replace with actual path
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1e2a78] via-[#2c3e91] to-[#1e2a78] p-6 text-white font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-4xl font-extrabold text-white drop-shadow-md">🚀 AI Models</h1>
            <p className="text-blue-300 text-sm mt-1">
              Explore and host AI models securely and efficiently.
              <a href="#" className="text-blue-400 hover:underline ml-1">Learn more</a>
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <p className="text-lg text-white/80">Loading models...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {models.map((model) => (
              <Card
                key={model.id}
                className="relative bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,255,0.25)] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(99,102,241,0.3)]"
              >
                <CardBody className="p-0">
                  {/* Top Image Preview */}
                  <div className="rounded-t-3xl overflow-hidden">
                    <img
                      src={model.image}
                      alt={model.name}
                      className="w-full h-52 object-cover object-center"
                    />
                  </div>

                  <div className="p-6">
                    {/* Model Info */}
                    <div className="flex gap-4 items-start mt-2">
                      <div className="w-14 h-14 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-full flex items-center justify-center text-xl font-bold text-white shadow-md">
                        {model.name.charAt(0)}
                      </div>

                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-xl font-semibold text-white drop-shadow">{model.name} (#{model.id})</h3>
                            <span className="text-xs px-2 py-1 mt-1 bg-blue-500/10 text-blue-300 border border-blue-400/20 rounded-full inline-block backdrop-blur-sm">
                              Model
                            </span>
                          </div>
                          {model.hostAddresses.length >= 2 ? (
                            <div className="flex items-center gap-1">
                              <div className="w-3 h-3 rounded-full bg-green-400"></div>
                              <span className="text-xs text-green-200">Active</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <div className="w-3 h-3 rounded-full bg-yellow-300"></div>
                              <span className="text-xs text-yellow-200">Available</span>
                            </div>
                          )}
                        </div>

                        <p className="text-sm mt-2 text-blue-100/90">{model.description}</p>

                        <p className="text-xs text-blue-300 mt-4 mb-2">
                          Hosted by {model.hostAddresses.length} node(s) of {model.numberOfNodes} required
                        </p>

                        <div className="flex flex-wrap gap-2">
                          {model.hostAddresses.map((addr, i) => (
                            <span
                              key={i}
                              className="px-3 py-1 text-xs rounded-full border border-white/20 bg-white/10 text-white/90 backdrop-blur-sm"
                            >
                              {addr}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Button */}
                    <div className="mt-6 text-right">
                      <Button
                        color="primary"
                        size="sm"
                        className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 text-white px-4 py-1 rounded-full shadow-lg hover:shadow-indigo-500/40"
                      >
                        View Instructions
                      </Button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
