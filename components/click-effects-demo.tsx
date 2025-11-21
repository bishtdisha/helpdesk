'use client';

import { CheckCircle, AlertCircle, Info, Trash2, Edit, Plus, Download } from 'lucide-react';

/**
 * Click Effects Demo Component
 * Demonstrates all the blue click effects across different UI elements
 */
export function ClickEffectsDemo() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-display mb-4">🔵 Universal Blue Click Effects</h1>
          <p className="text-body-lg text-muted-foreground">
            Click any element below to see the blue ripple effect in action
          </p>
        </header>

        {/* Primary Buttons */}
        <section className="space-y-4">
          <h2 className="text-3xl font-semibold tracking-tight mb-6">Primary Buttons</h2>
          <div className="flex flex-wrap gap-4">
            <button className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-lg font-medium transition-colors">
              Primary Button
            </button>
            <button className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-lg font-medium transition-colors">
              <Plus className="h-5 w-5 inline mr-2" />
              With Icon
            </button>
            <button className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-lg font-medium transition-colors glow-on-click">
              With Glow Effect
            </button>
          </div>
        </section>

        {/* Secondary Buttons */}
        <section className="space-y-4">
          <h2 className="text-3xl font-semibold tracking-tight mb-6">Secondary Buttons</h2>
          <div className="flex flex-wrap gap-4">
            <button className="bg-secondary text-secondary-foreground hover:bg-secondary/90 px-6 py-3 rounded-lg font-medium transition-colors">
              Secondary Button
            </button>
            <button className="border-2 border-primary text-primary hover:bg-primary/10 px-6 py-3 rounded-lg font-medium transition-colors">
              Outline Button
            </button>
            <button className="text-primary hover:bg-primary/10 px-6 py-3 rounded-lg font-medium transition-colors">
              Ghost Button
            </button>
          </div>
        </section>

        {/* Semantic Buttons */}
        <section className="space-y-4">
          <h2 className="text-3xl font-semibold tracking-tight mb-6">Semantic Buttons</h2>
          <div className="flex flex-wrap gap-4">
            <button className="bg-success text-success-foreground hover:bg-success/90 px-6 py-3 rounded-lg font-medium transition-colors">
              <CheckCircle className="h-5 w-5 inline mr-2" />
              Success
            </button>
            <button className="bg-warning text-warning-foreground hover:bg-warning/90 px-6 py-3 rounded-lg font-medium transition-colors">
              <AlertCircle className="h-5 w-5 inline mr-2" />
              Warning
            </button>
            <button className="bg-destructive text-destructive-foreground hover:bg-destructive/90 px-6 py-3 rounded-lg font-medium transition-colors">
              <Trash2 className="h-5 w-5 inline mr-2" />
              Delete
            </button>
          </div>
        </section>

        {/* Icon Buttons */}
        <section className="space-y-4">
          <h2 className="text-3xl font-semibold tracking-tight mb-6">Icon Buttons</h2>
          <div className="flex flex-wrap gap-4">
            <button className="p-3 rounded-lg hover:bg-muted transition-colors" title="Edit">
              <Edit className="h-5 w-5" />
            </button>
            <button className="p-3 rounded-lg hover:bg-muted transition-colors" title="Delete">
              <Trash2 className="h-5 w-5 text-destructive" />
            </button>
            <button className="p-3 rounded-lg hover:bg-muted transition-colors" title="Download">
              <Download className="h-5 w-5" />
            </button>
            <button className="p-3 rounded-lg hover:bg-muted transition-colors" title="Info">
              <Info className="h-5 w-5 text-accent" />
            </button>
          </div>
        </section>

        {/* Links */}
        <section className="space-y-4">
          <h2 className="text-3xl font-semibold tracking-tight mb-6">Links</h2>
          <div className="flex flex-wrap gap-6">
            <a href="#" className="text-primary hover:text-primary/80 font-medium">
              Standard Link
            </a>
            <a href="#" className="text-primary hover:text-primary/80 font-medium underline">
              Underlined Link
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground font-medium">
              Muted Link
            </a>
          </div>
        </section>

        {/* Interactive Cards */}
        <section className="space-y-4">
          <h2 className="text-3xl font-semibold tracking-tight mb-6">Interactive Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card-clickable p-6">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <CheckCircle className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Clickable Card</h3>
              <p className="text-muted-foreground">
                Click anywhere on this card to see the effect
              </p>
            </div>

            <div className="card-clickable p-6">
              <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center mb-4">
                <Info className="h-6 w-6 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Another Card</h3>
              <p className="text-muted-foreground">
                Hover and click for smooth animations
              </p>
            </div>

            <div className="card-clickable p-6">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                <Plus className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Third Card</h3>
              <p className="text-muted-foreground">
                All cards have consistent effects
              </p>
            </div>
          </div>
        </section>

        {/* Custom Clickable Elements */}
        <section className="space-y-4">
          <h2 className="text-3xl font-semibold tracking-tight mb-6">Custom Clickable Elements</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="clickable p-6 bg-muted rounded-lg">
              <h4 className="text-lg font-semibold mb-2">Custom Element 1</h4>
              <p className="text-body-sm text-muted-foreground">
                Any element with .clickable class gets the effect
              </p>
            </div>

            <div className="clickable p-6 bg-primary/5 border border-primary/20 rounded-lg">
              <h4 className="text-lg font-semibold text-primary mb-2">Custom Element 2</h4>
              <p className="text-body-sm text-foreground">
                Works with any background color
              </p>
            </div>
          </div>
        </section>

        {/* Button Groups */}
        <section className="space-y-4">
          <h2 className="text-3xl font-semibold tracking-tight mb-6">Button Groups</h2>
          <div className="inline-flex rounded-lg border border-border overflow-hidden">
            <button className="px-4 py-2 border-r border-border hover:bg-muted transition-colors">
              Left
            </button>
            <button className="px-4 py-2 border-r border-border hover:bg-muted transition-colors">
              Middle
            </button>
            <button className="px-4 py-2 hover:bg-muted transition-colors">
              Right
            </button>
          </div>
        </section>

        {/* List Items */}
        <section className="space-y-4">
          <h2 className="text-3xl font-semibold tracking-tight mb-6">Interactive List Items</h2>
          <div className="space-y-2">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="clickable flex items-center gap-4 p-4 bg-card border border-border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-semibold">{item}</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">List Item {item}</h4>
                  <p className="text-body-sm text-muted-foreground">
                    Click this entire row to see the effect
                  </p>
                </div>
                <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                  <Edit className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Disabled State */}
        <section className="space-y-4">
          <h2 className="text-3xl font-semibold tracking-tight mb-6">Disabled State</h2>
          <div className="flex flex-wrap gap-4">
            <button
              disabled
              className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium"
            >
              Disabled Button
            </button>
            <button
              disabled
              className="border-2 border-primary text-primary px-6 py-3 rounded-lg font-medium"
            >
              Disabled Outline
            </button>
          </div>
          <p className="text-body-sm text-muted-foreground">
            Disabled buttons don't show click effects
          </p>
        </section>

        {/* Footer */}
        <footer className="text-center pt-12 border-t border-border">
          <p className="text-body text-muted-foreground">
            All effects are applied automatically using CSS - no JavaScript required!
          </p>
        </footer>
      </div>
    </div>
  );
}
